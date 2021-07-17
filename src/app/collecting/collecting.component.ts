import { Component, OnDestroy, OnInit } from "@angular/core";
import p5 from "p5";
import * as ml5 from "../../assets/ml5.min.js";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { ModalComponent } from "../shared/components/modal/modal.component";

const { poseNet, neuralNetwork } = ml5;

const electron = window.require("electron");

@Component({
  selector: "app-collecting",
  templateUrl: "./collecting.component.html",
  styleUrls: ["./collecting.component.scss"],
})
export class CollectingComponent implements OnInit, OnDestroy {
  private p5;
  constructor(private router: Router, public dialog: MatDialog) {}

  video: any;
  poseNet: any;
  pose: any;
  skeleton: any;
  brain: any;
  position: any;
  state = "waiting";
  postureLabel: string;
  loader: HTMLElement;
  container: HTMLElement;
  title: string;
  instructionsToUserArrayIndex = 0;
  dataGatheringTimer = 5;
  timer = this.dataGatheringTimer;
  instructionsToUser = [
    "Sit in the correct position, look at the monitor",
    "Sit in the correct position and tilt your face left and right",
    "Sit in the correct position and tilt your face up and down",
    "Sit with the wrong postures, look at the monitor",
    "Sit with the wrong postures and tilt your face left and right",
    "Sit with the wrong postures and tilt your face up and down",
  ];

  ngOnInit(): void {
    this.loader = document.querySelector("app-loader");
    this.container = document.querySelector(".example-card");
    this.showGatheringDataModal("Correct posture");
  }

  ngOnDestroy(): void {
    this.p5.remove();
    this.video.remove();
  }

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
        .getElementById("webcam-container")
        .appendChild(canvasCreate.canvas);
      this.video = p.createCapture(constraints);
      this.video.remove();
      this.video.size(500, 300);
      this.poseNet = poseNet(this.video);
      this.poseNet.on("pose", this.gotPoses.bind(this));

      const options = {
        inputs: 34,
        outputs: 2,
        task: "classification",
        downloadModelsOnSave: false,
      };
      this.brain = neuralNetwork(options);
      p.draw = this.draw.bind(this);
    };
  }

  // this function for collect conrdinates and also set posture values
  collectPostures(): void {
    this.position = this.postureLabel;
    this.state = "collecting";
  }

  // this function is for stop collecting conrdinates
  stopCollectingPostures(): void {
    const { ipcRenderer } = electron;
    ipcRenderer.send("play-ding");
    this.state = "waiting";
  }

  // this function show the postures instructions with 15 seconds timer and perform the action after timer complete
  processForGatheringData(title) {
    this.title = title;
    this.collectPostures();
    const timeOut = setInterval(() => {
      if (this.timer > 0) {
        this.timer--;
      } else {
        this.stopCollectingPostures();
        this.timer = this.dataGatheringTimer;
        clearInterval(timeOut);
        setTimeout(() => {
          this.instructionsToUserArrayIndex++;
          if (title === this.instructionsToUser[2]) {
            this.showGatheringDataModal("Incorrect posture");
          } else if (title === this.instructionsToUser[5]) {
            this.title = null;
            this.trainModel();
          } else {
            this.timer = this.dataGatheringTimer;
            this.processForGatheringData(
              this.instructionsToUser[this.instructionsToUserArrayIndex]
            );
          }
        }, 1000);
      }
    }, 1000);
  }

  // This function is to train the json data
  trainModel(): void {
    this.brain.normalizeData();
    const options = {
      epochs: 50,
    };
    this.brain.train(options, this.finishedTraining.bind(this));
  }

  // This function creates the models files and then navigate to the home page
  finishedTraining(): void {
    this.brain.save("model", (data) => {
      const { ipcRenderer } = electron;
      ipcRenderer.once("files-created", () => {
        this.p5.remove();
        this.goToHomePage();
      });
      ipcRenderer.send("create-model-files", data);
    });
  }

  goToHomePage() {
    this.p5.remove();
    this.video.remove();
    this.router.navigate(["/home"]);
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
    } else {
      // if the pose varaible is empty this code will execute and set the timeout of 100 miliseconds and call this function again
      setTimeout(function () {
        this.predictPosition.bind(this);
      }, 100);
    }
  }

  // This function get the cordinates of body and set it into the pose and skeleton varaibles
  gotPoses(poses: Array<any>): void {
    if (poses.length > 0) {
      this.pose = poses[0].pose;
      this.skeleton = poses[0].skeleton;
      if (this.state == "collecting") {
        // if the state is collecting this code will excute to collect the cordinates
        const inputs = [];
        for (let i = 0; i < this.pose.keypoints.length; i++) {
          const x = this.pose.keypoints[i].position.x;
          const y = this.pose.keypoints[i].position.y;
          inputs.push(x);
          inputs.push(y);
        }
        const posture = [this.position];
        this.brain.addData(inputs, posture);
      }
    }
  }

  // This function set the width and height of webcam view, it also process and show the positions with percentage according to the cordinates
  draw(): void {
    this.p5.push();
    this.p5.translate(this.video.width, 0);
    this.p5.scale(-1, 1);
    this.p5.image(this.video, 0, 0, this.video.width, this.video.height);
    this.p5.pop();
  }

  // this function show the modal to user to sit correct or incorrect position
  showGatheringDataModal(posture) {
    this.postureLabel = posture;
    if (this.postureLabel === "Correct posture") {
      this.createCanvas();
    }
    const modal = this.dialog.open(ModalComponent, {
      hasBackdrop: false,
      data: {
        message:
          this.postureLabel === "Correct posture"
            ? "We're now gathering data for the Correct Posture"
            : "We're now gathering data for the Incorrect Posture",
      },
    });
    modal.afterClosed().subscribe(() => {
      this.container.style.display = "flex";
      this.processForGatheringData(
        this.instructionsToUser[this.instructionsToUserArrayIndex]
      );
    });
  }
}
