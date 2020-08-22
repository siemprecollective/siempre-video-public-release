class TouchInfo {
  // TODO unite all touch actions under an interface here, somehow
  constructor() {
    this.nTouches = 0;
    this.nDragging = 0;
    this.wasDrag = false;

    document.body.ontouchstart = document.body.ontouchend = event => {
      this.nTouches = event.touches.length;
    };
  }

  // TODO this sucks because it requires the components doing dragging to self
  // report that they're doing so
  dragging() {
    return this.nDragging !== 0;
  }
  interactionStart() {
    this.wasDrag = false;
  }
  notifyDragging(isDragging) {
    if (isDragging) {
      this.nDragging = 1;
      this.wasDrag = true;
    } else {
      this.nDragging = 0;
    }
  }
}

let touchInfo = new TouchInfo();

export { touchInfo };
