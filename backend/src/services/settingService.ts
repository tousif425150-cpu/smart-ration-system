import { prisma } from '../config/prisma';

export const SETTING_KEYS = {
  FACE_VERIFICATION_DISTRIBUTION: 'isFaceVerificationRequiredForDistribution',
};

export const getSetting = async (key: string, defaultValue: string = 'false'): Promise<string> => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });
    return setting ? setting.value : defaultValue;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return defaultValue;
  }
};

export const setSetting = async (key: string, value: string, description?: string) => {
  return prisma.systemSetting.upsert({
    where: { key },
    update: { value, updatedAt: new Date() },
    create: { key, value, description },
  });
};

export const isFaceVerificationRequired = async (): Promise<boolean> => {
  const value = await getSetting(SETTING_KEYS.FACE_VERIFICATION_DISTRIBUTION, 'true');
  return value === 'true';
};
