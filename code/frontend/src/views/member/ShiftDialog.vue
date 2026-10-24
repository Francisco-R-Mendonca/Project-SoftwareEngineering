<template>
  <v-dialog v-model="dialog" persistent width="1300">
    <v-card style="min-height: 70vh">
      <v-card-title>
        <span class="headline">New Shift</span>
      </v-card-title>
      <v-card-text>
        <v-form ref="form" lazy-validation>
          <v-row>
            <v-col cols="12" sm="6" md="6">
              <VueCtkDateTimePicker
                label="*Start Time"
                id="startTimeInput"
                format="YYYY-MM-DDTHH:mm:ssZ"
                :rules="[(v) => !!v || 'Start time is required']"
                required
                v-model="shift.startTime"
                :append-to-body="true"
              ></VueCtkDateTimePicker>
            </v-col>
            <v-col cols="12" sm="6" md="6">
              <VueCtkDateTimePicker
                label="*End Time"
                id="endTimeInput"
                format="YYYY-MM-DDTHH:mm:ssZ"
                :rules="[(v) => !!v || 'End time is required']"
                required
                v-model="shift.endTime"
                :append-to-body="true"
              ></VueCtkDateTimePicker>
            </v-col>
            <v-col cols="12">
              <v-text-field
                label="*Location"
                :rules="[
                  (v) => !!v || 'Location is required',
                  (v) => !v || v.trim().length >= 20 || 'Location must have at least 20 characters',
                  (v) => !v || v.trim().length <= 200 || 'Location must have at most 200 characters'
                ]"
                counter="200"
                v-model="shift.location"
                required
                data-cy="locationInput"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                label="*Participants Limit"
                :rules="[(v) => !!v || 'Participants Limit is required',]"
                required
                v-model="shift.participantsLimit"
                data-cy="participantsLimitInput"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="blue-darken-1"
          variant="text"
          @click="$emit('close-shift-dialog')"
        >
          Close
        </v-btn>
        <v-btn
          :disabled="!canSave"
          color="blue-darken-1"
          variant="text"
          @click="saveShift"
          data-cy="saveShift"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import { Vue, Component, Prop, Model } from 'vue-property-decorator';
import Shift from '@/models/shift/Shift';
import RemoteServices from '@/services/RemoteServices';
import VueCtkDateTimePicker from 'vue-ctk-date-time-picker';
import 'vue-ctk-date-time-picker/dist/vue-ctk-date-time-picker.css';
import { ISOtoString } from '@/services/ConvertDateService';

Vue.component('VueCtkDateTimePicker', VueCtkDateTimePicker);
@Component({
  methods: { ISOtoString },
})
export default class ShiftDialog extends Vue {
  @Model('dialog', Boolean) dialog!: boolean;
  @Prop({ type: Number, required: true })
  readonly activityId!: number;

  shift: Shift = new Shift();

  get canSave(): boolean {
    const location = this.shift.location?.trim() ?? '';
    return (
      !!this.shift.startTime &&
      !!this.shift.endTime &&
      !!this.shift.participantsLimit &&
      !!this.shift.location &&
      location.length >= 20 &&
      location.length <= 200
    );
  }

  async saveShift() {
    if ((this.$refs.form as Vue & { validate: () => boolean }).validate()) {
      try {
        const result = await RemoteServices.createShift(
          this.activityId,
          this.shift
        );

        this.$emit('save-shift', result);
      } catch (error) {
        await this.$store.dispatch('error', error);
      }
    }
  }

}
</script>

<style scoped lang="scss">
::v-deep(.v-overlay__content) {
  overflow: visible !important;
}

::v-deep(.v-dialog) {
  overflow: visible !important;
}

::v-deep(.v-card) {
  overflow: visible !important;
}

/* picker */
::v-deep(.ctk-date-time-picker) {
  position: relative;
  z-index: 9999 !important;
}

::v-deep(.ctk-dropdown) {
  transform: scale(0.85);
  transform-origin: top left;
  z-index: 10000 !important;
}
</style>