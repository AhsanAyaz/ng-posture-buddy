import { app, BrowserWindow, ipcMain, screen } from "electron";
import * as path from "path";
import * as url from "url";
import * as fs from "fs-extra";
import { soundSourceDirectory, SOUND_FILE_NAME, userDirectory } from "./config";
import * as arrayBufferToBuffer from "arraybuffer-to-buffer";
import * as load from "audio-loader";
import * as play from "audio-play";
import getLogger from "./logger";

// Initialize remote module
require("@electron/remote/main").initialize();

let win: BrowserWindow = null;
const logger = getLogger();
let dingSoundBuffer;
const args = process.argv.slice(1),
  serve = args.some((val) => val === "--serve");

function createWindow(): BrowserWindow {
  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      allowRunningInsecureContent: serve ? true : false,
      contextIsolation: false, // false if you want to run 2e2 test with Spectron
      enableRemoteModule: true, // true if you want to run 2e2 test  with Spectron or use remote module in renderer context (ie. Angular)
    },
  });

  if (serve) {
    win.webContents.openDevTools();

    require("electron-reload")(__dirname, {
      electron: require(`${__dirname}/../node_modules/electron`),
    });
    win.loadURL("http://localhost:4200");
  } else {
    win.loadURL(
      url.format({
        pathname: path.join(__dirname, "../dist/index.html"),
        protocol: "file:",
        slashes: true,
      })
    );
  }

  // Emitted when the window is closed.
  win.on("closed", () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  return win;
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on("ready", () => {
    setTimeout(createWindow, 400);
    logger.info("App Ready", "Model Directory " + userDirectory.modelDirectory);
    logger.info(
      "App Ready",
      "Sounds Directory " + userDirectory.soundDirectory
    );
    logger.info("App Ready", "Logs Directory " + userDirectory.logsDirectory);
    try {
      if (!fs.existsSync(userDirectory.modelDirectory)) {
        logger.info(
          "App Ready",
          "Creating model directory at " + userDirectory.modelDirectory
        );
        fs.mkdirSync(userDirectory.modelDirectory, {
          recursive: true,
        });
      }
      if (!fs.existsSync(userDirectory.logsDirectory)) {
        logger.info(
          "App Ready",
          "Creating logs directory at " + userDirectory.logsDirectory
        );
        fs.mkdirSync(userDirectory.logsDirectory, {
          recursive: true,
        });
      }
      if (!fs.existsSync(userDirectory.soundDirectory)) {
        logger.info(
          "App Ready",
          "Creating sound directory at " + userDirectory.soundDirectory
        );
        fs.mkdirSync(userDirectory.soundDirectory, {
          recursive: true,
        });
      }
      fs.copy(
        soundSourceDirectory,
        path.join(userDirectory.soundDirectory, SOUND_FILE_NAME),
        (err) => {
          if (err) {
            logger.error("App Ready", "error in copying", err);
          }
          load(path.join(userDirectory.soundDirectory, SOUND_FILE_NAME))
            .then((buffer) => {
              dingSoundBuffer = buffer;
              logger.info("App Ready", "sound buffer initated");
            })
            .catch((err) =>
              logger.error("App Ready", "error in loading sound to buffer", err)
            );
        }
      );
    } catch (err) {
      logger.error("Error in app init electron thread", err.toString());
    }
  });

  // Quit when all windows are closed.
  app.on("window-all-closed", () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

  ipcMain.on("play-ding", () => {
    play(dingSoundBuffer, {}, () => {
      logger.info("play-ding", "done playing ding sound");
    });
  });

  ipcMain.on("create-model-files", (event, data) => {
    try {
      logger.info("create-model-files", "init");
      if (fs.readdirSync(userDirectory.modelDirectory).length !== 0) {
        fs.emptyDirSync(userDirectory.modelDirectory);
        logger.info("create-model-files", "Models folder emptied");
      }
      logger.info("create-model-files", "data received", data);
      fs.outputJSONSync(
        `${userDirectory.modelDirectory}/model.json`,
        data.manifest
      );
      logger.info("create-model-files", "manifest created");
      fs.outputFile(
        `${userDirectory.modelDirectory}/model.weights.bin`,
        arrayBufferToBuffer(data.weightData)
      );
      logger.info("create-model-files", "weights file created");
      fs.outputJson(
        `${userDirectory.modelDirectory}/model_meta.json`,
        data.meta
      );
      logger.info("create-model-files", "model meta json created");
      logger.info(
        "create-model-files",
        "All files created, replying with the files created message"
      );
      event.reply("files-created");
    } catch (err) {
      logger.error("create-model-files", err);
      logger.info(
        "create-model-files",
        "Files saving check encountered an error"
      );
    }
  });
} catch (e) {
  logger.error("Main thread", "Something happened in the main block");
  logger.error("Main thread", e);
}
