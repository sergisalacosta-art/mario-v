import Phaser from 'phaser';

export function configureCamera(camera: Phaser.Cameras.Scene2D.Camera, worldPixelWidth: number, worldPixelHeight: number): void {
  camera.setBounds(0, 0, worldPixelWidth, worldPixelHeight);
  camera.roundPixels = true;
}
