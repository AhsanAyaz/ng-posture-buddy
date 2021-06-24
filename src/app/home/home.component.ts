import { Component, OnInit } from "@angular/core";
import * as p5 from "p5";
import * as ml5 from "ml5";

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
  rightPosture: any;
  wrongPosture: any;
  rightPostureValue: any;
  wrongPostureValue: any;
  postures: any;
  timer = null;
  userDirectory = process.env.USERPROFILE + "/Downloads/ng-posture-buddy/model";

  delay(time: number) {
    return new Promise((resolve, reject) => {
      if (isNaN(time)) {
        reject(new Error("delay requires a valid number."));
      } else {
        setTimeout(resolve, time);
      }
    });
  }

  // This function is called from inIt() and this function calls the main setup() function
  private createCanvas() {
    this.p5 = new p5(this.setup.bind(this));
  }

  // This is a main function which create canvas for webcam and it also use the ml5 functions
  setup(p: any) {
    p.setup = () => {
      let canvasCreate = p.createCanvas(300, 300);
      document
        .getElementById("webcam-container")
        .appendChild(canvasCreate.canvas);
      this.video = p.createCapture(p.VIDEO);
      this.video.size(300, 300);
      this.video.remove();
      this.poseNet = ml5.poseNet(this.video, this.modelLoaded.bind(this));
      this.poseNet.on("pose", this.gotPoses.bind(this));

      const options = {
        inputs: 34,
        outputs: 2,
        task: "classification",
        debug: true,
      };
      this.brain = ml5.neuralNetwork(options);
      this.brain.load(
        this.userDirectory + "/model.json",
        this.brainLoaded.bind(this)
      );
    };

    p.draw = this.draw.bind(this);
  }

  // This function is called after brain loaded the models files and then it call the predictPosition function
  brainLoaded() {
    console.log("pose predicting ready!");
    this.predictPosition();
  }

  // This function is created to push the x,y cordinates of body parts into new inputs array and send it into the brain classify function
  predictPosition() {
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
  gotResult(error: any, results: any) {
    this.postures = results;
    this.predictPosition();
  }

  // This function get the cordinates of body and set it into the pose varaible
  gotPoses(poses: string | any[]) {
    if (poses.length > 0) {
      this.pose = poses[0].pose;
    }
  }

  // This function is called when webcam is show on page
  modelLoaded() {
    console.log("poseNet ready");
  }

  // This function is created to clear the notification setTimeOut interval timer
  clearTimer() {
    clearTimeout(this.timer);
    this.timer = null;
  }

  // This function set the width and height of webcam view, it also process and show the positions with percentage according to the cordinates
  draw() {
    this.p5.push();
    this.p5.translate(this.video.width, 0);
    this.p5.scale(-1, 1);
    +this.p5.image(this.video, 0, 0, this.video.width, this.video.height);

    let label1: HTMLElement = document.querySelector("#label1");
    let label2: HTMLElement = document.querySelector("#label2");
    let bar1: HTMLElement = document.querySelector("#bar1");
    let bar2: HTMLElement = document.querySelector("#bar2");
    let container: HTMLElement = document.querySelector(".container");
    let loader: HTMLElement = document.querySelector("app-loader");

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
      this.rightPostureValue = Math.floor(this.rightPosture);
      this.wrongPostureValue = Math.floor(this.wrongPosture);
      bar1.innerText = this.rightPostureValue + "%";
      bar2.innerText = this.wrongPostureValue + "%";
      bar1.style.width = this.rightPostureValue + "%";
      bar2.style.width = this.wrongPostureValue + "%";
      container.style.display = "block";
      loader.style.display = "none";
    }
  }
}
