<template>
  <v-dialog v-model="dialog" persistent width="800">
    <v-card>
      <v-card-title>
        <span class="headline">
          {{
            editEnrollment && editEnrollment.id === null
              ? 'New Application'
              : 'Edit Application'
          }}
        </span>
      </v-card-title>
      <v-card-text>
        <v-form ref="form" lazy-validation>
          <v-row>
            <v-col cols="12">
              <v-textarea
                label="*Motivation"
                :rules="[(v) => !!v || 'Motivation is required']"
                required
                v-model="editEnrollment.motivation"
                data-cy="motivationInput"
                auto-grow
                rows="1"
              ></v-textarea>
            </v-col>
            <v-col cols="12">
              <v-select
                v-model="editEnrollment.shiftIds"
                :items="availableShifts"
                item-title="label"
                item-value="id"
                label="*Shifts"
                multiple
                chips
                closable-chips
                :rules="[(v) => (v && v.length > 0) || 'At least one shift is required']"
                data-cy="shiftsSelect"
              >
                <template v-slot:item="data">
                  {{ data.item.startTime }} - {{ data.item.endTime }} | {{ data.item.location }} | MAX {{ data.item.participantsLimit }}
                </template>

                <template v-slot:selection="data">
                  {{ data.item.startTime }} - {{ data.item.endTime }} | {{ data.item.location }}
                </template>
              </v-select>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="blue-darken-1"
          variant="text"
          @click="$emit('close-enrollment-dialog')"
        >
          Close
        </v-btn>
        <v-btn
          v-if="canSave"
          color="blue-darken-1"
          variant="text"
          @click="updateEnrollment"
          data-cy="saveEnrollment"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import { Vue, Component, Prop, Model } from 'vue-property-decorator';
import RemoteServices from '@/services/RemoteServices';
import { ISOtoString } from '@/services/ConvertDateService';
import Enrollment from '@/models/enrollment/Enrollment';
import Shift from '@/models/shift/Shift';

@Component({
  methods: { ISOtoString },
})
export default class EnrollmentDialog extends Vue {
  @Model('dialog', Boolean) dialog!: boolean;
  @Prop({ type: Enrollment, required: true }) readonly enrollment!: Enrollment;

  editEnrollment: Enrollment = new Enrollment();
  availableShifts: Shift[] = [];

  async created() {
    this.editEnrollment = new Enrollment(this.enrollment);

    if (this.editEnrollment.activityId !== null) {
      this.availableShifts = await RemoteServices.getActivityShifts(this.editEnrollment.activityId);
    }
  }

  get canSave(): boolean {
    return (
      !!this.editEnrollment.motivation &&
      this.editEnrollment.motivation.length >= 10 &&
      !!this.editEnrollment.shiftIds &&
      this.editEnrollment.shiftIds.length > 0
    );
  }

  async updateEnrollment() {
    if (this.hasOverlappingShifts()) {
      await this.$store.dispatch(
        'error',
        'Selected shifts have overlapping periods',
      );
      return;
    }
    //editar
    if (
      this.editEnrollment.id !== null &&
      (this.$refs.form as Vue & { validate: () => boolean }).validate()
    ) {
      try {
        const result = await RemoteServices.editEnrollment(
          this.editEnrollment.id,
          this.editEnrollment,
        );
        this.$emit('update-enrollment', result);
      } catch (error) {
        await this.$store.dispatch('error', error);
      }
    }
    //criar
    else if (
      this.editEnrollment.activityId !== null &&
      (this.$refs.form as Vue & { validate: () => boolean }).validate()
    ) {
      try {
        const result = await RemoteServices.createEnrollment(
          this.editEnrollment,
        );
        this.$emit('save-enrollment', result);
      } catch (error) {
        await this.$store.dispatch('error', error);
      }
    }
  }

  hasOverlappingShifts(): boolean {
    const selectedShifts = this.availableShifts.filter((shift: Shift) =>
      this.editEnrollment.shiftIds.includes(shift.id!)
    );

    for (let i = 0; i < selectedShifts.length; i++) {
      for (let j = i + 1; j < selectedShifts.length; j++) {
        const s1 = selectedShifts[i];
        const s2 = selectedShifts[j];

        const start1 = this.parseDate(s1.startTime);
        const end1 = this.parseDate(s1.endTime);
        const start2 = this.parseDate(s2.startTime);
        const end2 = this.parseDate(s2.endTime);

        if (start1 < end2 && start2 < end1) {
          return true;
        }
      }
    }
    return false;
  }

  parseDate(dateStr: string): number {
    return new Date(dateStr.replace(' ', 'T')).getTime();
  }

}
</script>

<style scoped lang="scss"></style>
