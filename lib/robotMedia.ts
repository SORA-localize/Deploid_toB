import type { ImageAsset, ImageRole, Robot } from '@/data/types';
import { getDisplayableAsset } from '@/lib/media';

export const ROBOT_IMAGE_ROLE_ORDER: ImageRole[] = [
  'hero',
  'transparent',
  'side',
  'inOperation',
  'scale',
  'endEffector',
  'mobility',
];

const ROBOT_PRIMARY_IMAGE_ROLE_ORDER: ImageRole[] = [
  'transparent',
  'hero',
  'inOperation',
  'side',
  'scale',
  'endEffector',
  'mobility',
];

export interface DisplayableRobotImage {
  role: ImageRole;
  asset: ImageAsset;
}

type RobotImagesRecord = Pick<Robot, 'images'>;

/** 権利gateを通る登録済み画像だけを、詳細表示のrole順で返す。 */
export function getDisplayableRobotImages(robot: RobotImagesRecord): DisplayableRobotImage[] {
  return ROBOT_IMAGE_ROLE_ORDER.flatMap((role) => {
    const asset = getDisplayableAsset(robot.images?.[role]);
    return asset ? [{ role, asset }] : [];
  });
}

/** カード・比較・metadata・JSON-LDで共有する代表画像resolver。 */
export function getRobotPrimaryImage(robot: RobotImagesRecord): ImageAsset | undefined {
  for (const role of ROBOT_PRIMARY_IMAGE_ROLE_ORDER) {
    const asset = getDisplayableAsset(robot.images?.[role]);
    if (asset) return asset;
  }
  return undefined;
}
