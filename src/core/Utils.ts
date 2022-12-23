import { Rect, Spaces } from "./Tableturf";

export class MatrixUtil {
  static parse(str: string): Rect {
    let len = 0;
    let width = -1;
    let height = 0;
    const values = [];
    for (let i = 0; i < str.length; ++i) {
      switch (str.charAt(i)) {
        case "@":
          values.push(Spaces.INVALID);
          break;
        case ".":
          values.push(Spaces.EMPTY);
          break;
        case "#":
          values.push(Spaces.NEUTRAL);
          break;
        case "a":
          values.push(Spaces.TRIVIAL * 1);
          break;
        case "A":
          values.push(Spaces.SPECIAL * 1);
          break;
        case "b":
          values.push(Spaces.TRIVIAL * -1);
          break;
        case "B":
          values.push(Spaces.SPECIAL * -1);
          break;
        case "\n":
          const dx = values.length - len;
          len = values.length;
          if (dx > 0) {
            height += 1;
            if (width < 0) {
              width = dx;
            } else {
              console.assert(width == dx, width + "=" + dx);
            }
          }
          break;
      }
    }
    return {
      size: [width, height],
      values,
    };
  }

  static print(m: Rect): string {
    const {
      size: [width, height],
      values,
    } = m;
    let str = "";
    for (let y = 0; y < height; ++y) {
      for (let x = 0; x < width; ++x) {
        switch (values[x + y * width]) {
          case Spaces.EMPTY:
            str += ".";
            break;
          case Spaces.INVALID:
            str += "@";
            break;
          case Spaces.NEUTRAL:
            str += "#";
            break;
          case Spaces.TRIVIAL * 1:
            str += "a";
            break;
          case Spaces.SPECIAL * 1:
            str += "A";
            break;
          case Spaces.TRIVIAL * -1:
            str += "b";
            break;
          case Spaces.SPECIAL * -1:
            str += "B";
            break;
        }
      }
      str += "\n";
    }
    return str;
  }
}

export function shuffle<T>(li: T[]) {
  li = li.slice();
  for (let i = li.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = li[i];
    li[i] = li[j];
    li[j] = temp;
  }
  return li;
}
