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

import { maxBy, values } from 'lodash';
import {
  LIGHT_PRIMARY_TEXT_COLOR,
  LIGHT_TERTIARY_TEXT_COLOR,
} from '../styles';

const OVERDRAW = 1.2;

export interface IRange {
  start: number;
  end: number;
}

export interface ICommentsByColumn {
  [key: string]: Array<number>;
}

const DIAMETER = 2 / 3;
const MARGIN = 1 - DIAMETER;

export class DotChartRenderer {

  // Technically either an HTMLCanvas Element or Canvas instance
  private canvas: any = null;

  private commentsByColumn: ICommentsByColumn = null;
  private selectedRangeStart: number = null;
  private selectedRangeEnd: number = null;
  private width: number = null;
  private height: number = null;
  private isNode: boolean = typeof window === 'undefined';
  private showAll = true;
  private backgroundColor: string | null = null;
  private makeCanvas: (width: number, height: number) => any = null;
  private isDirty = false;

  constructor(makeCanvas: (width: number, height: number) => any) {
    this.makeCanvas = makeCanvas;
  }

  setProps(props: {
    // Technically either an HTMLCanvas Element or Canvas instance
    canvas?: any;

    width?: number;
    height?: number;
    selectedRangeStart?: number;
    selectedRangeEnd?: number;
    commentsByColumn?: ICommentsByColumn;
    showAll?: boolean;
    backgroundColor?: string | null;

    [key: string]: any;
  }) {
    this.isDirty = false;

    Object.keys(props)
        .filter((key) => ['canvas', 'width', 'height', 'selectedRangeStart', 'selectedRangeEnd', 'commentsByColumn', 'showAll', 'backgroundColor'].indexOf(key) !== -1)
        .forEach((key) => this.setProp(key, props[key]));

    if (this.isDirty) {
      this.render();
    }
  }

  setProp(key: string, value: any) {
    if ((this as any)[key] === value) { return; }

    this.isDirty = true;
    (this as any)[key] = value;
  }

  render() {
    if (!this.canvas) {
      if (this.isNode) { throw new Error('Missing canvas instance'); }

      return;
    }

    if (!this.width || !this.height) {
      if (this.isNode) { throw new Error('Missing canvas height or width'); }

      return;
    }

    if (!this.isNode) {
      const elementWidth = (window.devicePixelRatio || 1) * this.width;
      const elementHeight = (window.devicePixelRatio || 1) * this.height;

      if (this.width !== this.canvas.width || this.height !== this.canvas.height) {
        this.canvas.width = elementWidth;
        this.canvas.height = elementHeight;
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
      }
    }

    if (this.showAll) {
      this.renderAll();
    } else {
      this.renderMax();
    }
  }

  private renderAll(): void {
    const columnsByIndex = Object.keys(this.commentsByColumn).sort();
    const columnCount = columnsByIndex.length;

    const items = (values(this.commentsByColumn) as Array<any>);
    const maxColumnCount = maxBy(items, (c) => c.length);

    if (!this.commentsByColumn) {
      if (this.isNode) { throw new Error('Missing comments by column'); }

      return;
    }

    const ctx = this.canvas.getContext('2d');

    if (this.backgroundColor) {
      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    ctx.save();

    let dpr = 1;
    if (!this.isNode) {
      dpr = (window.devicePixelRatio || 1);
      ctx.scale(dpr, dpr);
    }

    const stepX = this.width / columnCount;
    const stepY = this.height / maxColumnCount;

    const radiusX = (DIAMETER / 2) * stepX;
    const radiusY = (DIAMETER / 2) * stepY;

    const radius = Math.min(radiusX, radiusY);

    const marginX = MARGIN * stepX;
    const marginY = MARGIN * stepY;

    const startY = this.height - radius - (marginY / 2);

    for (let i = 0; i < columnCount; i++) {
      const x = stepX * i;
      const key = columnsByIndex[i];
      const colValue = i / columnCount;
      const comments = this.commentsByColumn[key];

      const isSelected = (
        'undefined' !== typeof this.selectedRangeStart &&
        'undefined' !== typeof this.selectedRangeEnd
      ) && (colValue >= this.selectedRangeStart && colValue < this.selectedRangeEnd);

      ctx.fillStyle =
        isSelected ? LIGHT_PRIMARY_TEXT_COLOR : LIGHT_TERTIARY_TEXT_COLOR;

      for (let j = 0; (j < comments.length); j++) {
        const screenX = x + radius + (marginX / 2);
        const screenY = startY - (stepY * j);

        const image = this.makeSprite(radius * dpr, isSelected);
        ctx.drawImage(image, screenX - (radius / OVERDRAW), screenY - (radius / OVERDRAW), radius * 2, radius * 2);
      }
    }

    ctx.restore();
  }

  private renderMax(): void {
    if (!this.commentsByColumn) {
      if (this.isNode) { throw new Error('Missing comments by column'); }

      return;
    }

    const columnsByIndex = Object.keys(this.commentsByColumn).sort();
    const columnCount = columnsByIndex.length;

    const ctx = this.canvas.getContext('2d');

    if (this.backgroundColor) {
      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    ctx.save();

    let dpr = 1;
    if (!this.isNode) {
      dpr = (window.devicePixelRatio || 1);
      ctx.scale(dpr, dpr);
    }

    const step = this.width / columnCount;
    const radius = (DIAMETER / 2) * step;
    const margin = MARGIN * step;
    const startY = this.height - radius - (margin / 2);

    for (let i = 0; i < columnCount; i++) {
      const x = step * i;
      const key = columnsByIndex[i];
      const colValue = i / columnCount;
      const comments = this.commentsByColumn[key];

      const isSelected = (
        'undefined' !== typeof this.selectedRangeStart &&
        'undefined' !== typeof this.selectedRangeEnd
      ) && (colValue >= this.selectedRangeStart && colValue < this.selectedRangeEnd);

      ctx.fillStyle =
        isSelected ? LIGHT_PRIMARY_TEXT_COLOR : LIGHT_TERTIARY_TEXT_COLOR;

      for (let j = 0; (j < comments.length); j++) {
        const y = step * j;
        const nextTopY = (startY - (step * (j + 1))) - (radius + (margin / 2));
        const screenX = x + radius + (margin / 2);
        const screenY =  startY - y;

        if (nextTopY < 0) {
          const w = radius * 2;
          const h = radius / 2;
          ctx.fillRect(screenX - radius, screenY - (h / 2), w, h);
          ctx.fillRect(screenX - (h / 2), screenY - radius, h, w);
          break;
        } else {
          const image = this.makeSprite(radius * dpr, isSelected);
          ctx.drawImage(image, screenX - (radius / OVERDRAW), screenY - (radius / OVERDRAW), radius * 2, radius * 2);
        }
      }
    }

    ctx.restore();
  }

  private spriteCache: { [radius: string]: { [isSelected: string]: any } } = {};
  private makeSprite(radius: number, isSelected: boolean): any {
    const radiusKey = radius.toString();
    const isSelectedKey = isSelected.toString();

    if (
      this.spriteCache[radiusKey] &&
      this.spriteCache[radiusKey][isSelectedKey]
    ) { return this.spriteCache[radiusKey][isSelectedKey]; }

    this.spriteCache[radiusKey] = this.spriteCache[radiusKey] || {};

    const c = this.makeCanvas(
      (radius * 2) * OVERDRAW,
      (radius * 2) * OVERDRAW,
    );

    const ctx = c.getContext('2d');

    ctx.fillStyle =
      isSelected ? LIGHT_PRIMARY_TEXT_COLOR : LIGHT_TERTIARY_TEXT_COLOR;

    ctx.beginPath();
    ctx.moveTo(c.width / 2, c.height / 2);
    ctx.arc(c.width / 2, c.height / 2, radius, 0, Math.PI * 2);
    ctx.fill();

    this.spriteCache[radiusKey][isSelectedKey] = c;

    return c;
  }
}
