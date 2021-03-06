import { Component, OnDestroy, OnInit} from '@angular/core';
import {PetService} from "../shared/pet.service";
import {MainService} from "./main.service";
import {ServerService} from "../shared/server.service";
import {Subscription, Observable} from "rxjs";
import {Food} from "../shared/food.model";
import {StomachService} from "./content/stomach/stomach.service";
import {GameService} from "../shared/game.service";
import {CanComponentDeactivate} from "./can-deactivate-guard.service";
import {AuthService} from "../authentication/auth-service";
import {DictionaryService} from "../shared/dictionary.service";
// import {r} from "@angular/core/src/render3";
import {AngularFireAuth} from "angularfire2/auth"
import { AlertifyService } from 'app/shared/alertify.service';

declare var $: any;
@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
  providers: []
})
export class MainComponent implements OnInit, OnDestroy, CanComponentDeactivate {
  loading = true;
  authSub: Subscription;
  tokenSub: Subscription;
  isFeeding = false;
  user: any;
  closeModalBoxSub: Subscription;
  notificationSub: Subscription;
  foodAddedSub: Subscription;
  extraNavActivated = false;
  firstTimeInited = true;

  // exit: any = () => {
  //     this.petServ.saveLeaveTimeAndHungerTime();
  //     this.petServ.destroyPet()
  // };
  vis = (function(){
    var stateKey, eventKey, keys = {
      hidden: "visibilitychange",
      webkitHidden: "webkitvisibilitychange",
      mozHidden: "mozvisibilitychange",
      msHidden: "msvisibilitychange"
    };
    for (stateKey in keys) {
      if (stateKey in document) {
        eventKey = keys[stateKey];
        break;
      }
    }
    return function(c) {
      if (c) {document.addEventListener(eventKey, c)};
      return !document[stateKey];
    }
  })();
  constructor(private mainServ: MainService,
              private petServ: PetService,
              private serverServ: ServerService,
              private authServ: AuthService,
              private af: AngularFireAuth,
              private alertify: AlertifyService
              ) {
  }
  // @HostListener('window:beforeunload', ['$event'])
  // beforeUnloadHander($event) {
  //   this.exit();
  // };

  ngOnInit() {
    this.authSub = this.af.authState.subscribe(user =>{
      if (user && user.uid) {
        this.user = user;
        if (!this.serverServ.isTokenExpired(this.user)) {
          // Set up token so that it can be used to interact with the database
          this.serverServ.setUpOwnerIdAndToken(this.user);
          this.loading = false;
        } else {
          this.authServ.logOut();
        }
      } else {
        window.location.href = 'authentication/login';
      }
    });

    // //Wait for the ownerKey to be ready first before performing orchestration to load owner, pet and stomach
    this.tokenSub = this.serverServ.onOwnerIdAndTokenReady.subscribe(
      () => {
        this.init()
      }

    );

    const body = document.getElementsByTagName("BODY")[0];
    if (body.classList.contains('modal-open')) {
      body.classList.remove('modal-open');
      const shadowEl = document.getElementsByClassName('modal-backdrop');
      shadowEl[0].remove();
    }
    // Used to give notifications from any component within main
    this.notificationSub = this.mainServ.onNotify
      .subscribe(
        (message: string) => confirm(message)
      );

    this.closeModalBoxSub = this.mainServ.onCloseFeedBox.subscribe(
      () => {
        this.closeModalBox()
      }
    );

    // To be able to add food at any component within main
    this.foodAddedSub = this.mainServ.onFeedPet.subscribe(
      (food) => {
        this.mainServ.feedPet(food);
      }
    );

    /**
     *   Save Pet when the user minimize the window on mobile phone
     */
    this.vis(() => {
      // if the user goes away from the screen
      if (!this.vis(() => {
        })) {
        this.petServ.saveLeaveTimeAndHungerTime();
      } else {
        // when the user come back to the screen, check if token has been expired and update hunger time
        //If not expired
        if (!this.serverServ.isTokenExpired(this.user)){
          this.petServ.checkHealthAndRetrievePet();
        //If expired, delete token
        }else{
          this.authServ.logOut()
        }
      }
    })
  }

  /**
   * Invoked after token is set up
   * Purpose: Orchestrate the initiation process
   */
  init(){
    // Initiate owner
    this.mainServ.initOwner();

    // Initiate pet
    this.mainServ.initPet();
    this.petServ.startGettingHungry();

    // Load food from the server to stomach
    this.mainServ.loadFoodsInStomach();
  }

  // $(document).on('keydown', 'ctrl+enter', () => {

  // });
  onFeed() {
    this.isFeeding = true;
  }

  onLogOut() {
    this.alertify.confirm("Are you sure you want to disconnect with your pet?", () => {
      this.authServ.logOut();
    })
  }
  closeModalBox() {
    $('.modal-backdrop').removeClass('modal-backdrop');
    this.isFeeding = false;
    this.extraNavActivated = false;
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    // If not expired (e.g user press the arrow back button on the browser)
    if (!this.serverServ.isTokenExpired(this.user)) {
      if (confirm('Are you sure you want to disconnect with your pet?')){
        this.authServ.logOut();
      }
      // if token is expired
    } else if (this.serverServ.isTokenExpired(this.user)) {
       alert('Your pet was playful, please connect again to see him/her');
       this.authServ.logOut();
       return true
    }
  }

  ngOnDestroy() {
    // Unsubscribe subscription
    this.closeModalBoxSub.unsubscribe();
    this.notificationSub.unsubscribe();
    this.authSub.unsubscribe();
    this.tokenSub.unsubscribe();
    this.mainServ.resetInitiation();
    this.foodAddedSub.unsubscribe();
    this.petServ.destroyPet();
    this.firstTimeInited = true;
  }
}
