export enum TimerIdEnum {
  checkInValidDatasetFiles = 'checkInValidDatasetFiles',
  checkInvalidDatasetData = 'checkInvalidDatasetData',
  checkInvalidVector = 'checkInvalidVector',
  clearExpiredSubPlan = 'clearExpiredSubPlan',
  updateStandardPlan = 'updateStandardPlan'
}

export const timerIdMap = {
  [TimerIdEnum.checkInValidDatasetFiles]: 'checkInValidDatasetFiles',
  [TimerIdEnum.checkInvalidDatasetData]: 'checkInvalidDatasetData',
  [TimerIdEnum.checkInvalidVector]: 'checkInvalidVector',
  [TimerIdEnum.clearExpiredSubPlan]: 'clearExpiredSubPlan',
  [TimerIdEnum.updateStandardPlan]: 'updateStandardPlan'
};
