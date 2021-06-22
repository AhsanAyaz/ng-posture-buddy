import { Component, OnInit } from '@angular/core';
import * as p5 from 'p5';
import * as ml5 from 'ml5';
const electron = window.require("electron");
const { ipcRenderer } = electron

@Component({
  selector: 'app-collecting',
  templateUrl: './collecting.component.html',
  styleUrls: ['./collecting.component.scss']
})
export class CollectingComponent implements OnInit {
  private p5;
  constructor() { }

  ngOnInit(): void {
    this.createCanvas();
  }

  video: any;
  poseNet: any;
  pose: any;
  skeleton: any;

  brain: any;

  position: any;
  state = 'waiting';
  postureLabel: any;
  recording = false;
  startRecording: any;
  stopRecording: any;
  mode = 'collecting';

  delay(time) {
    return new Promise((resolve, reject) => {
      if (isNaN(time)) {
        reject(new Error('delay requires a valid number.'));
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
    this.startRecording.classList.add('disable');
    this.startRecording.disabled = true;
    this.stopRecording.classList.remove('disable');
    this.stopRecording.disabled = false;
    let selectTag: HTMLElement = document.querySelector('#postures');
    this.position = selectTag['value'];
    this.state = 'collecting';
    console.log('collecting');
  }

  // this function is for stop collecting conrdinates
  stop() {
    this.stopRecording.classList.add('disable');
    this.stopRecording.disabled = true;
    this.startRecording.classList.remove('disable');
    this.startRecording.disabled = false;
    this.state = 'waiting';
    console.log('not collecting');
  }

  // this function is for save the postures into json file

  saveData() {
    this.brain.saveData('postures');
    setTimeout(() => {
      ipcRenderer.off;
      ipcRenderer.on("json-file-move-reply", this.afterJsonFileMove.bind(this));
      ipcRenderer.send("json-file-move-message", "ping");
    }, 10000);
  }

  afterJsonFileMove(event?, arg?) {
    console.log(arg); // prints "pong"
    this.exportData();
  }

  // this function is for export the model files which is created by json file
  exportData() {
    this.brain.loadData('assets/postures.json');
    this.trainModel();
  }

  // this function is for priview the results
  preview() {
    this.mode = 'preview';
    this.setup.bind(this);
    let buttonsSection: HTMLElement = document.querySelector('.container');
    buttonsSection[0].style.display = 'none';
  }

  setup(p: any) {
    p.setup = () => {
      this.startRecording = document.getElementById('start');
      this.stopRecording = document.getElementById('stop');


      p.createCanvas(300, 300);

      this.video = p.createCapture(p.VIDEO);
      this.video.remove();
      this.video.size(300, 300);
      this.poseNet = ml5.poseNet(this.video, this.modelLoaded.bind(this));
      this.poseNet.on('pose', this.gotPoses.bind(this));

      let options = {
        inputs: 34,
        outputs: 2,
        task: 'classification',
        debug: true
      };
      this.brain = ml5.neuralNetwork(options);

      if (this.mode === 'preview') {
        const modelInfo = {
          model: 'model/model.json',
          metadata: 'model/model_meta.json',
          weights: 'model/model.weights.bin',
        };
        this.brain.load(modelInfo, this.brainLoaded.bind(this));
      }
      p.draw = this.draw.bind(this);
    }

  }

  trainModel() {
    this.brain.normalizeData();
    let options = {
      epochs: 50
    };
    this.brain.train(options, this.finishedTraining.bind(this));
  }

  brainLoaded() {
    console.log('pose predicting ready!');
    this.predictPosition();
  }

  finishedTraining() {
    this.brain.save();
      ipcRenderer.off;
      ipcRenderer.once("model-files-move-reply", this.afterModelsFileMove.bind(this));
      ipcRenderer.send("model-files-move-message", "ping");
    // predictPosition();
  }

  afterModelsFileMove(event, arg) {
    event.preventDefault();
    console.log(arg); // prints "pong"
  }

  predictPosition() {
    if (this.pose) {
      let inputs = [];
      for (let i = 0; i < this.pose.keypoints.length; i++) {
        let x = this.pose.keypoints[i].position.x;
        let y = this.pose.keypoints[i].position.y;
        inputs.push(x);
        inputs.push(y);
      }
      this.brain.classify(inputs, this.gotResult.bind(this));
    } else {
      setTimeout(this.predictPosition.bind(this), 100);
    }
  }

  gotResult(error, results) {
    this.postureLabel = results[0].label;
    this.predictPosition();
  }

  gotPoses(poses) {
    if (poses.length > 0) {
      this.pose = poses[0].pose;
      this.skeleton = poses[0].skeleton;
      if (this.state == 'collecting') {
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

  modelLoaded() {
    console.log('poseNet ready');
  }


  draw() {
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

    if (this.postureLabel) {
      const postureName: HTMLElement = document.querySelector('.posture-name');
      if (this.postureLabel === "right position") {
        postureName.style.color = "#5cb85c";
      } else {
        postureName.style.color = '#d9534f';
      }
      postureName.innerHTML = this.postureLabel;
    }
  }
}

