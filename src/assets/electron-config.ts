const userDir = process.env.USERPROFILE
  ? process.env.USERPROFILE
  : process.env.HOME;

export const userDirectory = {
  modelDirectory: userDir + "/Downloads/posture-buddy/model",
  soundDirectory: userDir + "/Downloads/posture-buddy/sound",
};
