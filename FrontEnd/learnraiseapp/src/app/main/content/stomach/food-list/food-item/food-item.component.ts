import {AfterViewChecked, Component, Input, OnChanges, OnDestroy, OnInit} from '@angular/core';
import {StomachService} from "../../stomach.service";
import {Subscription} from "rxjs/Subscription";

declare var $: any;
@Component({
  selector: 'app-food-item',
  templateUrl: './food-item.component.html',
  styleUrls: ['./food-item.component.css']
})
export class FoodItemComponent implements OnInit, OnDestroy {
  @Input() food;
  @Input() foodIndex;
  isCooked = true;
  checkIfIsCookedSub: Subscription;
  constructor(private stomachServ: StomachService) { }

  //If there is any change on any food item, ngOnInit will be called on all food item
  ngOnInit() {
    this.checkIfIsCooked();
  }

  /**
   * Triggered every time there is any change in any food item
   * To check if the food is cooked or not (word has enough info to be blue or red)
   */
  checkIfIsCooked() {
    if ( this.food.type === 'none' || !this.food.description ) {
      this.isCooked = false;
    } else {
      this.isCooked = true;
    }
  }

  onSelect() {
    this.stomachServ.foodSelectedEvent.emit(this.food);
  }

  edit() {
    this.stomachServ.foodEditEvent.next( this.foodIndex ); // Pass to stomach.ts
  }

  delete() {
    if (confirm('Are you sure you want to delete this food?')) {
      this.stomachServ.deleteFoodWithNameAndType(this.food.name, this.food.type);
    }
  }

  ngOnDestroy() {
  //   this.checkIfIsCookedSub.unsubscribe();
  }
}
