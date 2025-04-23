import { typeDftVal } from '@lib/types'

export function genDftFmProps(props: any[]) {
  const ret = {} as Record<string, any>
  for (const prop of props) {
    ret[prop.name] = typeDftVal(prop.ptype)
  }
  return ret
}

export type RectBox = {
  x: number
  y: number
  width: number
  height: number
}

export function inRect(point: { x: number; y: number }, rect: RectBox): boolean {
  return (
    point.x >= rect.x &&
    point.y >= rect.y &&
    point.x <= rect.x + rect.width &&
    point.y <= rect.y + rect.height
  )
}
