const userDir = process.env.USERPROFILE
  ? process.env.USERPROFILE
  : process.env.HOME;

export const userDirectory = {
  modelDirectory: userDir + "/Downloads/ng-posture-buddy/model",
  soundDirectory: userDir + "/Downloads/ng-posture-buddy/sound",
};
