import { Component, OnInit } from "@angular/core";
import * as p5 from "p5";
import { poseNet, neuralNetwork } from "ml5";
import { Router } from "@angular/router";
const electron = window.require("electron");
const { ipcRenderer } = electron;

@Component({
  selector: "app-collecting",
  templateUrl: "./collecting.component.html",
  styleUrls: ["./collecting.component.scss"],
})
export class CollectingComponent implements OnInit {
  private p5;
  constructor(private router: Router) {}

  ngOnInit(): void {
    this.createCanvas();
  }

  video: any;
  poseNet: any;
  pose: any;
  skeleton: any;
  brain: any;
  position: any;
  state = "waiting";
  postureLabel: any;
  recording = false;
  startRecording: any;
  stopRecording: any;
  loader: HTMLElement;
  container: HTMLElement;

  delay(time) {
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

  // this function for collect conrdinates and also set posture values
  start() {
    this.startRecording.classList.add("disable");
    this.startRecording.disabled = true;
    this.stopRecording.classList.remove("disable");
    this.stopRecording.disabled = false;
    let selectTag: HTMLElement = document.querySelector("#postures");
    this.position = selectTag["value"];
    this.state = "collecting";
  }

  // this function is for stop collecting conrdinates
  stop() {
    this.stopRecording.classList.add("disable");
    this.stopRecording.disabled = true;
    this.startRecording.classList.remove("disable");
    this.startRecording.disabled = false;
    this.state = "waiting";
  }

  // This is a main function which create canvas for webcam and it also use the ml5 functions
  setup(p: any) {
    p.setup = () => {
      this.startRecording = document.getElementById("start");
      this.stopRecording = document.getElementById("stop");

      const canvasCreate = p.createCanvas(500, 300);
      document
        .getElementById("webcam-container")
        .appendChild(canvasCreate.canvas);
      this.video = p.createCapture(p.VIDEO);
      this.video.remove();
      this.video.size(500, 300);
      this.poseNet = poseNet(this.video, this.modelLoaded.bind(this));
      this.poseNet.on("pose", this.gotPoses.bind(this));

      let options = {
        inputs: 34,
        outputs: 2,
        task: "classification",
      };
      this.brain = neuralNetwork(options);
      p.draw = this.draw.bind(this);
    };
  }

  // This function is to train the json data
  trainModel() {
    this.container.style.display = "none";
    this.loader.style.display = "block";
    this.p5.remove();
    this.brain.normalizeData();
    let options = {
      epochs: 50,
    };
    this.brain.train(options, this.finishedTraining.bind(this));
  }

  // This function creates the models files and then navigate to the home page
  finishedTraining() {
    alert("please save the files on Downloads/ng-posture-buddy/model");
    this.brain.save();
    ipcRenderer.once("file-created", (event, arg) => {
      this.router.navigate(["home"]);
    });
    ipcRenderer.send("check-files-are-created", "ping");
  }

  // This function is created to push the x,y cordinates of body parts into new inputs array and send it into the brain classify function
  predictPosition() {
    if (this.pose) {
      // if the pose varaible is not empty this code will execute
      let inputs = [];
      for (let i = 0; i < this.pose.keypoints.length; i++) {
        let x = this.pose.keypoints[i].position.x;
        let y = this.pose.keypoints[i].position.y;
        inputs.push(x);
        inputs.push(y);
      }
    } else {
      // if the pose varaible is empty this code will execute and set the timeout of 100 miliseconds and call this function again
      setTimeout(this.predictPosition.bind(this), 100);
    }
  }

  // This function get the cordinates of body and set it into the pose and skeleton varaibles
  gotPoses(poses) {
    if (poses.length > 0) {
      this.pose = poses[0].pose;
      this.skeleton = poses[0].skeleton;
      if (this.state == "collecting") {
        // if the state is collecting this code will excute to collect the cordinates
        let inputs = [];
        for (let i = 0; i < this.pose.keypoints.length; i++) {
          let x = this.pose.keypoints[i].position.x;
          let y = this.pose.keypoints[i].position.y;
          inputs.push(x);
          inputs.push(y);
        }
        const posture = [this.position];
        this.brain.addData(inputs, posture);
      }
    }
  }

  // This function shows the poseNet is ready
  modelLoaded() {
    console.log("poseNet ready");
  }

  // This function set the width and height of webcam view, it also process and show the positions with percentage according to the cordinates
  draw() {
    this.loader = document.querySelector("app-loader");
    this.container = document.querySelector(".container");
    this.p5.push();
    this.p5.translate(this.video.width, 0);
    this.p5.scale(-1, 1);
    this.p5.image(this.video, 0, 0, this.video.width, this.video.height);

    if (this.pose) {
      for (let i = 0; i < this.skeleton.length; i++) {
        let a = this.skeleton[i][0];
        let b = this.skeleton[i][1];
        this.p5.strokeWeight(2);
        this.p5.stroke(0);

        this.p5.line(a.position.x, a.position.y, b.position.x, b.position.y);
      }
      for (let i = 0; i < this.pose.keypoints.length; i++) {
        let x = this.pose.keypoints[i].position.x;
        let y = this.pose.keypoints[i].position.y;
        this.p5.fill(0);
        this.p5.stroke(255);
        this.p5.ellipse(x, y, 16, 16);
      }
    }
    this.p5.pop();

    this.container.style.display = "flex";
    this.loader.style.display = "none";
  }
}
