/*
Copyright 2017 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React from 'react';
import { IconBase } from './IconBase';

function makeIcon(contents: JSX.Element): React.ComponentClass<any> {
  return class extends React.PureComponent<any> {
    render() {
      return (
        <IconBase {...this.props}>
          {contents}
        </IconBase>
      );
    }
  };
}

/* tslint:disable:max-line-length */
export const AddIcon = makeIcon(<g><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/><path d="M0 0h24v24H0z" fill="none"/></g>);

export const ApproveIcon = makeIcon(<g><path d="M0,0H24V24H0V0Z" fill="none" /><path d="M9,16.17L4.83,12,3.41,13.41,9,19,21,7,19.59,5.59Z"/></g>);

export const ArrowIcon = makeIcon(<g><path d="M-4-4H20V20H-4Z" transform="translate(4 4)" fill="none"/><path d="M16,7H3.83L9.42,1.41,8,0,0,8l8,8,1.41-1.41L3.83,9H16Z" transform="translate(4 4)"/></g>);

export const BatchIcon = makeIcon(<g><path d="M3,17.5A1.5,1.5,0,1,1,1.5,16,1.5,1.5,0,0,1,3,17.5" /><path d="M3,13.5A1.5,1.5,0,1,1,1.5,12,1.5,1.5,0,0,1,3,13.5" /><path d="M3,9.5A1.5,1.5,0,1,1,1.5,8,1.5,1.5,0,0,1,3,9.5" /><path d="M7,9.5A1.5,1.5,0,1,1,5.5,8,1.5,1.5,0,0,1,7,9.5" /><path d="M7,5.5A1.5,1.5,0,1,1,5.5,4,1.5,1.5,0,0,1,7,5.5" /><path d="M7,13.5A1.5,1.5,0,1,1,5.5,12,1.5,1.5,0,0,1,7,13.5" /><path d="M7,17.5A1.5,1.5,0,1,1,5.5,16,1.5,1.5,0,0,1,7,17.5" /><path d="M11,17.5A1.5,1.5,0,1,1,9.5,16,1.5,1.5,0,0,1,11,17.5" /><path d="M11,13.5A1.5,1.5,0,1,1,9.5,12,1.5,1.5,0,0,1,11,13.5" /><path d="M11,9.5A1.5,1.5,0,1,1,9.5,8,1.5,1.5,0,0,1,11,9.5" /><path d="M15,17.5A1.5,1.5,0,1,1,13.5,16,1.5,1.5,0,0,1,15,17.5" /><path d="M15,13.5A1.5,1.5,0,1,1,13.5,12,1.5,1.5,0,0,1,15,13.5" /><path d="M15,9.5A1.5,1.5,0,1,1,13.5,8,1.5,1.5,0,0,1,15,9.5" /><path d="M15,5.5A1.5,1.5,0,1,1,13.5,4,1.5,1.5,0,0,1,15,5.5" /><path d="M19,5.5A1.5,1.5,0,1,1,17.5,4,1.5,1.5,0,0,1,19,5.5" /><path d="M19,9.5A1.5,1.5,0,1,1,17.5,8,1.5,1.5,0,0,1,19,9.5" /><path d="M19,13.5A1.5,1.5,0,1,1,17.5,12,1.5,1.5,0,0,1,19,13.5" /><path d="M19,17.5A1.5,1.5,0,1,1,17.5,16,1.5,1.5,0,0,1,19,17.5" /><path d="M15,1.5A1.5,1.5,0,1,1,13.5,0,1.5,1.5,0,0,1,15,1.5" /></g>);

export const ClockIcon = makeIcon(<g><path d="M10,0A10,10,0,1,0,20,10,10,10,0,0,0,10,0Zm0,18a8,8,0,1,1,8-8A8,8,0,0,1,10,18Z" transform="translate(2 2)"/><path d="M-2-2H22V22H-2Z" transform="translate(2 2)" fill="none"/><path d="M10.5,5H9v6l5.25,3.15L15,12.92l-4.5-2.67Z" transform="translate(2 2)"/></g>);

export const CloseIcon = makeIcon(<g><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/><path d="M0 0h24v24H0z" fill="none"/></g>);

export const DeferIcon = makeIcon(<g><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><path d="M0 0h24v24H0z" fill="none"/><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></g>);

export const DeleteIcon = makeIcon(<g><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/><path d="M0 0h24v24H0z" fill="none"/></g>);

export const EditIcon = makeIcon(<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>);

export const EmailIcon = makeIcon(<g><path d="M0,0H24V24H0V0Z" fill="none"/><path d="M20,4H4A2,2,0,0,0,2,6V18a2,2,0,0,0,2,2H20a2,2,0,0,0,2-2V6A2,2,0,0,0,20,4Zm0,14H4V8l8,5,8-5V18Zm-8-7L4,6H20Z"/></g>);

export const FaceIcon = makeIcon(<g><path d="M9 11.75c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm6 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.29.02-.58.05-.86 2.36-1.05 4.23-2.98 5.21-5.37C11.07 8.33 14.05 10 17.42 10c.78 0 1.53-.09 2.25-.26.21.71.33 1.47.33 2.26 0 4.41-3.59 8-8 8z"/><path d="M0 0h24v24H0z" fill="none"/></g>);

export const FlagIcon = makeIcon(<g><path d="M-5-4H19V20H-5Z" transform="translate(5 4)" fill="none"/><path d="M9.4,2,9,0H0V17H2V10H7.6L8,12h7V2Z" transform="translate(5 4)"/></g>);

export const HeartIcon = makeIcon(<g><path d="M0,0H24V24H0V0Z" fill="none"/><path d="M16.5,3A6,6,0,0,0,12,5.09,6,6,0,0,0,7.5,3,5.45,5.45,0,0,0,2,8.5C2,12.28,5.4,15.36,10.55,20L12,21.35,13.45,20C18.6,15.36,22,12.28,22,8.5A5.45,5.45,0,0,0,16.5,3ZM12.1,18.55l-0.1.1-0.1-.1C7.14,14.24,4,11.39,4,8.5A3.42,3.42,0,0,1,7.5,5a3.91,3.91,0,0,1,3.57,2.36h1.87A3.88,3.88,0,0,1,16.5,5,3.42,3.42,0,0,1,20,8.5C20,11.39,16.86,14.24,12.1,18.55Z"/></g>);

export const HighlightIcon = makeIcon(<g><path d="M17,3H7A2,2,0,0,0,5,5V21l7-3,7,3V5A2,2,0,0,0,17,3Z"/><path d="M0,0H24V24H0V0Z" fill="none"/></g>);

export const IdIcon = makeIcon(<g><path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/><path d="M0 0h24v24H0zm0 0h24v24H0z" fill="none"/></g>);

export const InfoIcon = makeIcon(<g><path d="M0 0h24v24H0z" fill="none"/><path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/></g>);

export const KeyDownIcon = makeIcon(<g><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></g>);

export const KeyUpIcon = makeIcon(<g><path d="M7 14l5-5 5 5z"/><path d="M0 0h24v24H0z" fill="none"/></g>);

export const ListIcon = makeIcon(<g><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/><path d="M0 0h24v24H0z" fill="none"/></g>);

export const LoadMoreIcon = makeIcon(<g><path d="M14.91,2.91A2.91,2.91,0,1,1,12,0a2.91,2.91,0,0,1,2.91,2.91"/><path d="M14.91,21.09A2.91,2.91,0,1,1,12,18.18a2.91,2.91,0,0,1,2.91,2.91"/><path d="M21.09,14.91A2.91,2.91,0,1,1,24,12a2.91,2.91,0,0,1-2.91,2.91"/><path d="M2.91,14.91A2.91,2.91,0,1,1,5.82,12a2.91,2.91,0,0,1-2.91,2.91"/><path d="M20.49,7.63a2.91,2.91,0,1,1,0-4.11,2.91,2.91,0,0,1,0,4.11"/><path d="M7.63,20.49a2.91,2.91,0,1,1,0-4.11,2.91,2.91,0,0,1,0,4.11"/><path d="M16.37,20.49a2.91,2.91,0,1,1,4.11,0,2.91,2.91,0,0,1-4.11,0"/><path d="M3.51,7.63a2.91,2.91,0,1,1,4.11,0,2.91,2.91,0,0,1-4.11,0"/></g>);

export const MoreHorizontalIcon = makeIcon(<g><path d="M0 0h24v24H0z" fill="none"/><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></g>);

export const MoreVerticalIcon = makeIcon(<g><path d="M0,0H24V24H0V0Z" fill="none"/><path d="M12,8a2,2,0,1,0-2-2A2,2,0,0,0,12,8Zm0,2a2,2,0,1,0,2,2A2,2,0,0,0,12,10Zm0,6a2,2,0,1,0,2,2A2,2,0,0,0,12,16Z"/></g>);

export const OpenIcon = makeIcon(<g><path d="M-3-3H21V21H-3Z" transform="translate(3 3)" fill="none"/><path d="M16,16H2V2H9V0H2A2,2,0,0,0,0,2V16a2,2,0,0,0,2,2H16a2,2,0,0,0,2-2V9H16ZM11,0V2h3.59L4.76,11.83l1.41,1.41L16,3.41V7h2V0Z" transform="translate(3 3)"/></g>);

export const RefreshIcon = makeIcon(<g><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/><path d="M0 0h24v24H0z" fill="none"/></g>);

export const RejectIcon = makeIcon(<g><path d="M19,6.41L17.59,5,12,10.59,6.41,5,5,6.41,10.59,12,5,17.59,6.41,19,12,13.41,17.59,19,19,17.59,13.41,12Z"/><path d="M0,0H24V24H0V0Z" fill="none"/></g>);

export const ReplyIcon = makeIcon(<g><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/><path d="M0 0h24v24H0z" fill="none"/></g>);

export const ReputationIcon = makeIcon(<g><path d="M0,0H24V24H0V0Z" fill="none"/><path d="M9,16.17L4.83,12,3.41,13.41,9,19,21,7,19.59,5.59Z"/></g>);

export const RoboIcon = makeIcon(<g><rect x="7" y="15" width="10" height="2"/><path d="M16,4H10V2h4V0H4V2H8V4H0V18H18V4Zm0,12H2V6H16Z" transform="translate(3 3)"/><circle cx="8" cy="12" r="1"/><circle cx="16" cy="12" r="1"/><rect width="24" height="24" fill="none"/></g>);

export const SearchIcon = makeIcon(<g><path d="M12.5,11h-.79l-.28-.27a6.51,6.51,0,1,0-.7.7l.27.28v.79l5,5L17.49,16Zm-6,0A4.5,4.5,0,1,1,11,6.5,4.49,4.49,0,0,1,6.5,11Z" transform="translate(3 3)"/><path d="M-3-3H21V21H-3Z" transform="translate(3 3)" fill="none"/></g>);

export const SelectAnotherIcon = makeIcon(<g><path d="M6.4,20.8a3.2,3.2,0,1,1-3.2-3.2,3.2,3.2,0,0,1,3.2,3.2" /><path d="M6.4,12A3.2,3.2,0,1,1,3.2,8.8,3.2,3.2,0,0,1,6.4,12" /><path d="M15.2,12A3.2,3.2,0,1,1,12,8.8,3.2,3.2,0,0,1,15.2,12" /><path d="M15.2,3.2A3.2,3.2,0,1,1,12,0a3.2,3.2,0,0,1,3.2,3.2" /><path d="M15.2,20.8A3.2,3.2,0,1,1,12,17.6a3.2,3.2,0,0,1,3.2,3.2" /><path d="M24,20.8a3.2,3.2,0,1,1-3.2-3.2A3.2,3.2,0,0,1,24,20.8" /></g>);

export const ThumbUpIcon = makeIcon(<g><path d="M0 0h24v24H0z" fill="none"/><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"/></g>);

export const UndoIcon = makeIcon(<g><path d="M0 0h24v24H0z" fill="none"/><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></g>);

export const UserIcon = makeIcon(<g><path d="M12,12A4,4,0,1,0,8,8,4,4,0,0,0,12,12Zm0,2c-2.67,0-8,1.34-8,4v2H20V18C20,15.34,14.67,14,12,14Z"/><path d="M0,0H24V24H0V0Z" fill="none"/></g>);

export const HomeIcon = makeIcon(<g><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/><path d="M0 0h24v24H0z" fill="none"/></g>);

export const EyeIcon = makeIcon(<g><path d="M0 0h24v24H0z" fill="none"/><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></g>);

/* tslint:enable:max-line-length */
