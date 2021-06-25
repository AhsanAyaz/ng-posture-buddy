import { Component, OnInit } from "@angular/core";
import * as p5 from "p5";
import * as ml5 from "ml5";
import { userDirectory } from "../../assets/electron-config";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnInit {
  private p5;
  constructor() {}
  ngOnInit(): void {
    this.createCanvas();
  }

  video: any;
  poseNet: any;
  pose: any;
  brain: any;
  rightPosture: number;
  wrongPosture: number;
  rightPostureValue: number;
  wrongPostureValue: number;
  postures: any;
  timer = null;

  // This function is called from inIt() and this function calls the main setup() function
  private createCanvas() {
    this.p5 = new p5(this.setup.bind(this));
  }

  // This is a main function which create canvas for webcam and it also use the ml5 functions
  setup(p: any): void {
    p.setup = () => {
      const canvasCreate = p.createCanvas(300, 300);
      document
        .getElementById("webcam-container")
        .appendChild(canvasCreate.canvas);
      this.video = p.createCapture(p.VIDEO);
      this.video.size(300, 300);
      this.video.remove();
      this.poseNet = ml5.poseNet(this.video);
      this.poseNet.on("pose", this.gotPoses.bind(this));

      const options = {
        inputs: 34,
        outputs: 2,
        task: "classification",
        debug: true,
      };
      this.brain = ml5.neuralNetwork(options);
      this.brain.load(
        userDirectory + "/model.json",
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

  // This function is created to clear the notification setTimeOut interval timer
  clearTimer(): void {
    clearTimeout(this.timer);
    this.timer = null;
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
    const container: HTMLElement = document.querySelector(".container");
    const loader: HTMLElement = document.querySelector("app-loader");

    this.p5.pop();

    if (this.postures) {
      // if postures are not empty then it will execute and looping the postures varaible
      this.postures.map(
        (data: {
          label: string;
          confidence: { toFixed: (arg0: number) => number };
        }) => {
          if (data.label === "right position") {
            // if data.label value is equal to right-position it will set the right position fields
            this.rightPosture = data.confidence.toFixed(2) * 100;
            label1.innerText = data.label + ": ";
          } else {
            // if data.label value is equal to wrong-position it will set the wrong position fields
            this.wrongPosture = data.confidence.toFixed(2) * 100;
            label2.innerText = data.label + ": ";
          }
        }
      );
      if (this.rightPostureValue < this.wrongPostureValue) {
        // If the wrong posture is greater than right posture about 1 minute it will show the notification to correct your position
        if (!this.timer) {
          // If the timer is empty this code will execute
          this.timer = setTimeout(() => {
            // This setTimeOut is execute after 1 minute again and again when the user not correct his positon in 1 minute
            Notification.requestPermission().then(function () {
              new Notification("Warning", {
                body: "You've been sitting with a wrong posture for about a minute now!",
              });
            });
            this.clearTimer();
          }, 5000);
        }
      } else {
        // if the right position is greate than wrong position this code will execute
        if (this.timer) {
          // if setTimeOut already set into timer this code will excute and call the clearTimer function
          this.clearTimer();
        }
      }
      this.rightPostureValue = Math.floor(this.rightPosture);
      this.wrongPostureValue = Math.floor(this.wrongPosture);
      bar1.innerText = `${this.rightPostureValue}%`;
      bar2.innerText = `${this.wrongPostureValue}%`;
      bar1.style.width = `${this.rightPostureValue}%`;
      bar2.style.width = `${this.wrongPostureValue}%`;
      container.style.display = "block";
      loader.style.display = "none";
    }
  }
}
