import type { FacingMode } from '$lib/helpers/camera'

export interface CameraControls {
  flash: 'flash-fill' | 'flash' | 'flash-not-available' | 'hide'
  flip: {
    facingMode: FacingMode
    show: boolean
  }
  timer: 'off' | '5s' | '10s'
}

export type UploadStatus = 'to-upload' | 'uploading' | 'uploaded'
