import { AfterViewInit, Component, OnInit } from "@angular/core";
import p5 from "p5";
import * as ml5 from "../../assets/ml5.min.js";
import { userDirectory } from "../../assets/electron-config";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnInit, AfterViewInit {
  private p5;
  constructor() {}
  ngOnInit(): void {}

  ngAfterViewInit() {
    this.createCanvas();
  }

  video: any;
  poseNet: any;
  pose: any;
  brain: any;
  correctPosture: number;
  incorrectPosture: number;
  correctPostureValue: number;
  incorrectPostureValue: number;
  postures: any;
  notificationTimer = null;
  positionCorrectedTimer = null;

  // This function is called from inIt() and this function calls the main setup() function
  private createCanvas() {
    this.p5 = new p5(this.setup.bind(this));
  }

  // This is a main function which create canvas for webcam and it also use the ml5 functions
  setup(p: any): void {
    p.setup = () => {
      const canvasCreate = p.createCanvas(500, 300);
      const constraints = {
        audio: false,
        video: {
          aspectRatio: 16 / 9,
        },
      };
      document
        .getElementById("home-camera-feed")
        .appendChild(canvasCreate.canvas);
      this.video = p.createCapture(constraints);
      this.video.size(500, 300);
      this.video.remove();
      this.poseNet = ml5.poseNet(this.video);
      this.poseNet.on("pose", this.gotPoses.bind(this));

      const options = {
        inputs: 34,
        outputs: 2,
        task: "classification",
      };
      this.brain = ml5.neuralNetwork(options);
      this.brain.load(
        `file://${userDirectory.modelDirectory}/model.json`,
        this.brainLoaded.bind(this)
      );
    };

    p.draw = this.draw.bind(this);
  }

  // This function is called after brain loaded the models files and then it call the predictPosition function
  brainLoaded(): void {
    console.log("pose predicting ready!");
    this.predictPosition();
  }

  // This function is created to push the x,y cordinates of body parts into new inputs array and send it into the brain classify function
  predictPosition(): void {
    if (this.pose) {
      // if the pose varaible is not empty this code will execute
      const inputs = [];
      for (let i = 0; i < this.pose.keypoints.length; i++) {
        const x = this.pose.keypoints[i].position.x;
        const y = this.pose.keypoints[i].position.y;
        inputs.push(x);
        inputs.push(y);
      }
      this.brain.classify(inputs, this.gotResult.bind(this));
    } else {
      // if the pose varaible is empty this code will execute and set the timeout of 100 miliseconds and call this function again
      setTimeout(() => {
        this.predictPosition();
      }, 100);
    }
  }

  // This function is set the postures result into the postures varaible and then call the predictPostion function
  gotResult(error: any, results: any): void {
    this.postures = results;
    this.predictPosition();
  }

  // This function get the cordinates of body and set it into the pose varaible
  gotPoses(poses: string | any[]): void {
    if (poses.length > 0) {
      this.pose = poses[0].pose;
    }
  }

  // This function is created to clear the notification setTimeOut interval notificationTimer
  notificationClearTimer(): void {
    clearTimeout(this.notificationTimer);
    this.notificationTimer = null;
  }

  // This function is created to clear the notification setTimeOut interval positionCorrectedTimer
  positionCorrectedClearTimer(): void {
    clearTimeout(this.positionCorrectedTimer);
    this.positionCorrectedTimer = null;
  }

  // This function set the width and height of webcam view, it also process and show the positions with percentage according to the cordinates
  draw(): void {
    this.p5.push();
    this.p5.translate(this.video.width, 0);
    this.p5.scale(-1, 1);
    +this.p5.image(this.video, 0, 0, this.video.width, this.video.height);

    const label1: HTMLElement = document.querySelector("#label1");
    const label2: HTMLElement = document.querySelector("#label2");
    const bar1: HTMLElement = document.querySelector("#bar1");
    const bar2: HTMLElement = document.querySelector("#bar2");
    const val1: HTMLElement = document.querySelector("#barPercent1");
    const val2: HTMLElement = document.querySelector("#barPercent2");

    this.p5.pop();

    if (this.postures) {
      // if postures are not empty then it will execute and looping the postures varaible
      this.postures.map(
        (data: {
          label: string;
          confidence: { toFixed: (arg0: number) => number };
        }) => {
          if (data.label === "Correct posture") {
            // if data.label value is equal to correct posture it will set the Correct posture fields
            this.correctPosture = data.confidence.toFixed(2) * 100;
            label1.innerText = data.label + ": ";
          } else {
            // if data.label value is equal to incorrect posture it will set the Incorrect posture fields
            this.incorrectPosture = data.confidence.toFixed(2) * 100;
            label2.innerText = data.label + ": ";
          }
        }
      );
      if (this.correctPostureValue < this.incorrectPostureValue) {
        if (this.positionCorrectedTimer) {
          // If the positionCorrectedTimer is set but user change the position in incorrect posture it will clear the positionCorrectedTimer
          this.positionCorrectedClearTimer();
        }
        // If the incorrect posture is greater than correct posture about 1 minute it will show the notification to correct your position
        if (!this.notificationTimer) {
          // If the notificationTimer  is empty this code will execute
          this.notificationTimer = setTimeout(() => {
            // This setTimeOut is execute after 1 minute again and again when the user not correct his positon in 1 minute
            Notification.requestPermission().then(function () {
              new Notification("Warning", {
                body: "You've been sitting with a wrong posture for about a minute now!",
              });
            });
            this.notificationClearTimer();
          }, 60000);
        }
      } else {
        // if the Correct posture is greate than Incorrect posture this code will execute
        if (this.notificationTimer) {
          // If the notificationTimer  is empty this code will execute
          if (!this.positionCorrectedTimer) {
            // If the positionCorrectedTimer is empty this code will execute
            this.positionCorrectedTimer = setTimeout(() => {
              // This setTimeOut is execute after 15 seconds if the user stil in Correct posture
              this.notificationClearTimer();
              this.positionCorrectedClearTimer();
            }, 15000);
          }
        }
      }
      this.correctPostureValue = Math.floor(this.correctPosture);
      this.incorrectPostureValue = Math.floor(this.incorrectPosture);
      val1.innerText = `${this.correctPostureValue}%`;
      val2.innerText = `${this.incorrectPostureValue}%`;
      bar1.style.width = `${this.correctPostureValue}%`;
      bar2.style.width = `${this.incorrectPostureValue}%`;
    }
  }
}
