import { moduleMetadata, Story, Meta } from '@storybook/angular';
import { CommonModule } from '@angular/common';

import Button from '../buttons/button-ex/button-ex.component';
import Header from '../header.component';
import { TopBarComponent } from './top-bar.component';

export default {
  title: 'Design System/TopBar',
  component: TopBarComponent,
  parameters: {
    // More on Story layout: https://storybook.js.org/docs/angular/configure/story-layout
    layout: 'fullscreen',
  },
  decorators: [
    moduleMetadata({
      declarations: [Button, Header],
      imports: [CommonModule],
    }),
  ],
} as Meta;

const Template: Story<TopBarComponent> = (args: TopBarComponent) => ({
  props: args,
});

export const TobBar_Clean = Template.bind({});

