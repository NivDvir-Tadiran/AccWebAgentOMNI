import { NgModule } from '@angular/core';
import {CommonModule, HashLocationStrategy, LocationStrategy} from '@angular/common';
//import { BrowserModule } from '@angular/platform-browser';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';


import Background1Component from "../../stories/pages/background1/background1Component";

import ButtonExComponent from "../../stories/buttons/button-ex/button-ex.component";

import { DynamicCompDirective } from '../directive/dynamic-comp.directive';
import {PopoverDirective} from "../directive/bubble-avatar/popover.directive";
import { BubbleAvatarComponent } from '../directive/bubble-avatar/bubble-avatar.component';
import { ActionAvatarComponent } from '../actions/action-avatar/action-avatar.component';

import {MdbPopoverModule} from "mdb-angular-ui-kit/popover";

import {MatButtonModule} from "@angular/material/button";
import ChatComponent from "../pages/chat/chat.component";
import {MenuPopoverDirective} from "../directive/bubble-windows-menu/menu-popover.directive";
import {ActionWindowsMenuComponent} from "../actions/action-windows-menu/action-windows-menu.component";
import {HighlightDirective} from "../directive/custom-directive/Highlight.directive";
import {BubbleWindowsMenuComponent} from "../directive/bubble-windows-menu/bubble-windows-menu.component";
import {ButtonsBoardComponent} from "../../app/AccAgent/acc-agent-page/buttons-board/buttons-board.component";
import {IntroComponent} from "../intro/intro.component";
import {TelephoneTestComponent} from "../top-bar/telephone-test/telephone-test.component";
import {SearchBarComponent} from "../top-bar/search-bar/search-bar.component";
import {IconLarge17Component} from "../top-bar/icon-large-17/icon-large-17.component";
import {SedButtonComponent} from "../top-bar/sed-button/sed-button.component";
import {IconSmall30Component} from "../top-bar/icon-small-30/icon-small-30.component";
import {IconSmall10Component} from "../top-bar/icon-small-10/icon-small-10.component";
import {ButtonComponent} from "../top-bar/button/button.component";
import {IconSmall33Component} from "../top-bar/icon-small-33/icon-small-33.component";
import {IconSmall11Component} from "../top-bar/icon-small-11/icon-small-11.component";
import {IconSmall12Component} from "../top-bar/icon-small-12/icon-small-12.component";
import {IconRecordComponent} from "../top-bar/icon-record/icon-record.component";
import {TopBarComponent} from "../top-bar/top-bar.component";
import {IconLarge30Component} from "../top-bar/icon-large-30/icon-large-30.component";
import {SearchOptionComponent} from "../top-bar/search-option/search-option.component";
import {IconSmall7Component} from "../top-bar/icon-small-7/icon-small-7.component";
import {IconSmall16Component} from "../top-bar/icon-small-16/icon-small-16.component";
import {IconSmall6Component} from "../top-bar/icon-small-6/icon-small-6.component";
import {InputsModule, MDBBootstrapModulesPro} from "ng-uikit-pro-standard";
import {MdbScrollspyModule} from "mdb-angular-ui-kit/scrollspy";
import {MDBRootModule} from "angular-bootstrap-md";
import {MdbCarouselModule} from "mdb-angular-ui-kit/carousel";
import {MdbCheckboxModule} from "mdb-angular-ui-kit/checkbox";
import {MdbCollapseModule} from "mdb-angular-ui-kit/collapse";
import {MdbDropdownModule} from "mdb-angular-ui-kit/dropdown";
import {MdbFormsModule} from "mdb-angular-ui-kit/forms";
import {MdbModalModule} from "mdb-angular-ui-kit/modal";
import {MdbRadioModule} from "mdb-angular-ui-kit/radio";
import {MdbRangeModule} from "mdb-angular-ui-kit/range";
import {MdbRippleModule} from "mdb-angular-ui-kit/ripple";
import {MdbTabsModule} from "mdb-angular-ui-kit/tabs";
import {MdbTooltipModule} from "mdb-angular-ui-kit/tooltip";
import {MdbValidationModule} from "mdb-angular-ui-kit/validation";
import {MatTabsModule} from "@angular/material/tabs";
import {MatIconModule} from "@angular/material/icon";
import {MatExpansionModule} from "@angular/material/expansion";
import {MatInputModule} from "@angular/material/input";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {MatTableModule} from "@angular/material/table";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatSelectModule} from "@angular/material/select";
import {MatRadioModule} from "@angular/material/radio";
import {MatPaginatorModule} from "@angular/material/paginator";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSortModule} from "@angular/material/sort";
import {MatMenuModule} from "@angular/material/menu";
import {MainDeskComponent} from "../main-desk/main-desk.component";
import {StatusLabelComponent} from "../main-desk/status-label/status-label.component";
import {ChatColumComponent} from "../main-desk/chat-colum/chat-colum.component";
import {ChatBubbleComponent} from "../main-desk/chat-bubble/chat-bubble.component";
import {Frame136Component} from "../main-desk/frame-136/frame-136.component";
import {TypeBarComponent} from "../main-desk/type-bar/type-bar.component";
import {IconLarge6Component} from "../main-desk/icon-large-6/icon-large-6.component";
import {IconLarge7Component} from "../main-desk/icon-large-7/icon-large-7.component";
import {IconLarge9Component} from "../main-desk/icon-large-9/icon-large-9.component";
import {IconLarge20Component} from "../main-desk/icon-large-20/icon-large-20.component";
import {IconSmall32Component} from "../main-desk/icon-small-32/icon-small-32.component";
import {IconPage7Component} from "../main-desk/icon-page-7/icon-page-7.component";
import {IconLarge13Component} from "../main-desk/icon-large-13/icon-large-13.component";
import {IconLargeT5Component} from "../main-desk/icon-large-t-5/icon-large-t-5.component";
import {IconLarge2Component} from "../main-desk/icon-large-2/icon-large-2.component";
import {IconLarge1Component} from "../main-desk/icon-large-1/icon-large-1.component";
import {IconLarge4Component} from "../main-desk/icon-large-4/icon-large-4.component";
import {IconLarge10Component} from "../main-desk/icon-large-10/icon-large-10.component";
import {
    SideMenuIconLarge38Component
} from "../main-desk/side-menu-icon-large-38/side-menu-icon-large-38.component";
import {SystemMessengeComponent} from "../main-desk/system-messenge/system-messenge.component";
import {IconPage2Component} from "../main-desk/icon-page-2/icon-page-2.component";
import {IconSmall8Component} from "../main-desk/icon-small-8/icon-small-8.component";
import {IconLarge11Component} from "../main-desk/icon-large-11/icon-large-11.component";
import {TypingBarReplyComponent} from "../main-desk/typing-bar-reply/typing-bar-reply.component";
import {CallBarComponent} from "../main-desk/call-bar/call-bar.component";










@NgModule({
    declarations: [
        Background1Component, ButtonExComponent, ButtonComponent,
        MenuPopoverDirective, PopoverDirective,
        ActionAvatarComponent, ActionWindowsMenuComponent,
        HighlightDirective,
        BubbleAvatarComponent, BubbleWindowsMenuComponent, DynamicCompDirective,
        ButtonsBoardComponent, IntroComponent,
        IconLarge17Component, SedButtonComponent, IconSmall30Component, IconSmall10Component, IconSmall33Component,
        IconSmall11Component, IconSmall12Component, IconRecordComponent, IconLarge30Component, SearchOptionComponent,
        IconSmall7Component, IconSmall16Component, IconSmall6Component,
        TopBarComponent, TelephoneTestComponent, SearchBarComponent,
        ChatComponent,
        MainDeskComponent, ChatColumComponent,
        CallBarComponent,
        ChatComponent,
        TypingBarReplyComponent,
        ButtonComponent,
        StatusLabelComponent,
        IconLarge11Component,
        IconSmall8Component,
        IconPage2Component,
        ChatBubbleComponent,
        SystemMessengeComponent,
        SideMenuIconLarge38Component,
        IconLarge10Component,
        IconLarge4Component,
        IconLarge1Component,
        IconLarge2Component,
        IconLargeT5Component,
        Frame136Component,
        IconSmall6Component,
        IconSmall16Component,
        IconLarge13Component,
        IconPage7Component,
        IconSmall32Component,
        IconLarge20Component,
        TypeBarComponent,
        IconLarge9Component,
        IconLarge7Component,
        IconLarge6Component,
    ],
    imports: [
        CommonModule, FormsModule, ReactiveFormsModule,

        MatTabsModule, MatIconModule, MatButtonModule, MatExpansionModule, MatInputModule, MatCheckboxModule,
        MatTableModule, MatToolbarModule, MatSelectModule, MatRadioModule, MatPaginatorModule, MatSlideToggleModule,
        MatSnackBarModule, MatFormFieldModule, MatSortModule, MatMenuModule,

        InputsModule, MDBRootModule,
        MdbCarouselModule, MdbCheckboxModule, MdbCollapseModule, MdbDropdownModule, MdbFormsModule,
        MdbModalModule, MdbPopoverModule, MdbRadioModule, MdbRangeModule, MdbRippleModule, MdbScrollspyModule,
        MdbTabsModule, MdbTooltipModule, MdbValidationModule,
    ],
  providers: [
  ],
  exports: [
      Background1Component, ButtonExComponent, ButtonComponent,
      MenuPopoverDirective, PopoverDirective,
      ActionAvatarComponent, ActionWindowsMenuComponent,
      HighlightDirective,
      BubbleAvatarComponent, BubbleWindowsMenuComponent, DynamicCompDirective,
      ButtonsBoardComponent, IntroComponent,
      IconLarge17Component, SedButtonComponent, IconSmall30Component, IconSmall10Component, IconSmall33Component,
      IconSmall11Component, IconSmall12Component, IconRecordComponent, IconLarge30Component, SearchOptionComponent,
      IconSmall7Component, IconSmall16Component, IconSmall6Component,
      TopBarComponent, TelephoneTestComponent, SearchBarComponent,
      ChatComponent,
      MainDeskComponent, ChatColumComponent,
      CallBarComponent,
      ChatComponent,
      TypingBarReplyComponent,
      ButtonComponent,
      StatusLabelComponent,
      IconLarge11Component,
      IconSmall8Component,
      IconPage2Component,
      ChatBubbleComponent,
      SystemMessengeComponent,
      SideMenuIconLarge38Component,
      IconLarge10Component,
      IconLarge4Component,
      IconLarge1Component,
      IconLarge2Component,
      IconLargeT5Component,
      Frame136Component,
      IconSmall6Component,
      IconSmall16Component,
      IconLarge13Component,
      IconPage7Component,
      IconSmall32Component,
      IconLarge20Component,
      TypeBarComponent,
      IconLarge9Component,
      IconLarge7Component,
      IconLarge6Component,





  ],
  bootstrap: [ ]
})
export class StorybookModule { }