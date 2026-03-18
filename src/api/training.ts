import { BACKEND_BASE_URL } from './backendBaseUrl'
import { httpRequest, ApiError } from '../lib/httpClient'

export interface Dataset {
  id: number
  name: string
  description: string
  filename: string
  row_count: number
  created_at: string
}

export interface Preset {
  id: number
  name: string
  description: string
  dataset_id: number
  dataset_name: string
  dataset_filename: string
  top_n: number
  k: number
  target_click_min: number
  target_click_max: number
  temaside_click_weight: number
  retningslinje_click_weight: number
  other_click_weight: number
  created_at: string
}

export interface GenerateRequest {
  preset_id?: number
  clear?: boolean
  top_n?: number
  k?: number
}

export interface GenerateResponse {
  success: boolean
  searches_created: number
  results_shown: number
  clicks_created: number
  skipped: number
  training_groups_available: number
}

export interface TrainRequest {
  days_back?: number
  min_group_size?: number
  require_any_click?: boolean
  save?: boolean
}

export interface TrainResponse {
  success: boolean
  groups_trained: number
  rows_trained: number
  error: string | null
}

export interface ModelInfo {
  available: boolean
  feature_names: string[]
  feature_importances: Record<string, number>
}

async function postJson<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const url = `${BACKEND_BASE_URL}${path}`
  if (import.meta.env.DEV) console.log('[HTTP POST]', url)
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  if (!response.ok) {
    throw new ApiError(
      `Request failed: ${response.status} ${response.statusText}`,
      response.status,
      response.statusText,
    )
  }
  return response.json() as Promise<T>
}

export async function getDatasets(signal?: AbortSignal): Promise<Dataset[]> {
  return httpRequest<Dataset[]>(`${BACKEND_BASE_URL}/dev/datasets`, { signal })
}

export async function getPresets(signal?: AbortSignal): Promise<Preset[]> {
  return httpRequest<Preset[]>(`${BACKEND_BASE_URL}/dev/presets`, { signal })
}

export async function generateTrainingData(
  params: GenerateRequest,
  signal?: AbortSignal,
): Promise<GenerateResponse> {
  return postJson<GenerateResponse>('/dev/generate', params, signal)
}

export async function trainModel(
  params: TrainRequest,
  signal?: AbortSignal,
): Promise<TrainResponse> {
  return postJson<TrainResponse>('/dev/train', params, signal)
}

export async function getModelInfo(signal?: AbortSignal): Promise<ModelInfo> {
  return httpRequest<ModelInfo>(`${BACKEND_BASE_URL}/dev/model`, { signal })
}
