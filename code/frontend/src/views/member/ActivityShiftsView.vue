<template>
    <div>
        <v-card class = "table">
            <v-card-title>
                <v-btn color="primary" @click="backToActivities" data-cy="backToActivities">
                    Back To activities
                </v-btn>
                <v-spacer />
                <v-btn 
                    :disabled="activity.state !== 'APPROVED'"
                    color="primary" 
                    @click="newShift" 
                    data-cy="newShift"
                >
                    New Shift
                </v-btn>
            </v-card-title>

            <v-data-table
                :headers="headers"
                :items="shifts"
                disable-pagination
                :hide-default-footer="true"
                :mobile-breakpoint="0"
                data-cy="activityShiftsTable"
            />
        </v-card>
        <shift-dialog
            v-if="activity && shiftDialog"
            v-model="shiftDialog"
            :activityId="activity.id"
            v-on:save-shift="onSaveShift"
            v-on:close-shift-dialog="onCloseShiftDialog"
        />
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import RemoteServices from '@/services/RemoteServices';
import Activity from '@/models/activity/Activity';
import Shift from '@/models/shift/Shift';
import ShiftDialog from '@/views/member/ShiftDialog.vue';

@Component({
  components: {
    'shift-dialog': ShiftDialog,
  },
})
export default class ActivityShiftsView extends Vue {
    activity: Activity | null = null;
    shifts: Shift[] = [];

    shiftDialog: boolean = false;

    headers: object = [
        {
            text: 'Start Time',
            value: 'startTime',
            align: 'left',
            width: '5%',
        },
        {
            text: 'End Time',
            value: 'endTime',
            align: 'left',
            width: '5%',
        },
        {
            text: 'Participants Limit',
            value: 'participantsLimit',
            align: 'left',
            width: '5%',
        },
        {
            text: 'Location',
            value: 'location',
            align: 'left',
            width: '5%',
        },
    ];

    async created() {
        await this.$store.dispatch('loading');
        try {
            this.activity = this.$store.getters.getActivity;

            if (this.activity && this.activity.id !== null) {
                this.shifts = await RemoteServices.getActivityShifts(this.activity.id);
            }
        } catch (error) {
            await this.$store.dispatch('error', error);
        }
        await this.$store.dispatch('clearLoading');
    }

    async backToActivities() {
        await this.$router.push({ name: 'institution-activities' });
    }

    newShift() {
        this.shiftDialog = true;
    }

    onCloseShiftDialog() {
        this.shiftDialog = false;
    }

    onSaveShift(shift: Shift) {
        this.shifts = this.shifts.filter(
        (s) => s.id !== shift.id,
        );
        this.shifts.unshift(shift);
        this.shiftDialog = false;
    }
}
</script>