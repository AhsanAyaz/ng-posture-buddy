import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
const electron = window.require("electron");
const { ipcRenderer } = electron;
@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    ipcRenderer.off;
    ipcRenderer.once("asynchronous-reply", this.onReply.bind(this));
    ipcRenderer.send("asynchronous-message", "ping");
  }

  onReply(event, arg) {
    console.log(arg); // prints "pong"
  }
}
