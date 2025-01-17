import { moduleMetadata, Story, Meta } from '@storybook/angular';
import { CommonModule } from '@angular/common';


import { ChatMdComponent } from './chat-md.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {ChatBubbleComponent} from "../chat-bubble/chat-bubble.component";
import {SystemMessengeComponent} from "../system-messenge/system-messenge.component";

export default {
  title: 'Design System/MainDesk/ChatMd',
  component: ChatMdComponent,
  parameters: {
    // More on Story layout: https://storybook.js.org/docs/angular/configure/story-layout
    layout: 'fullscreen',
  },
  decorators: [
    moduleMetadata({
      declarations: [ChatBubbleComponent, SystemMessengeComponent],
      imports: [CommonModule, FormsModule, ReactiveFormsModule ],
    }),
  ],
} as Meta;

const Template: Story<ChatMdComponent> = (args: ChatMdComponent) => ({
  props: {
    ...args,
  },
});

export const ChatMd_Clean = Template.bind({});
ChatMd_Clean.args = {
    type: "chat",
    wight: "normal"
}




