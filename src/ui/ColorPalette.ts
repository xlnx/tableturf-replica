import { Color } from "../engine/Color";

export interface PlayerColorPalette {
  primary: Color;
  secondary: Color;
  fire: {
    center: Color;
    primary: Color;
    secondary: Color;
  };
  spCutIn: {
    fg: {
      primary: Color;
      secondary: Color;
    };
    bg: Color;
    ink: Color;
    img: Color;
  };
  szMeter: {
    fg: Color;
    bg: Color;
  };
}

export class ColorPalette {
  static readonly Space = {
    overlay: {
      invalid: Color.fromRgb01([0.78, 0.78, 0.78]),
    },
    flash: {
      primary: Color.WHITE,
      secondary: Color.fromRgb01([1, 1, 0.6]),
    },
  };

  static readonly Entry = {
    bg: {
      primary: Color.fromHex(0x262626),
      secondary: Color.fromHex(0x191919),
    },
  };

  static readonly Main = {
    bg: {
      primary: Color.fromHex(0x4838a3),
      // primary: Color.fromRgb255([74, 43, 207]),
      // secondary: Color.fromRgb255([69, 72, 58]),
    },
    activeBtn: Color.fromHex(0xd2e332),
    inactiveBtn: Color.fromHex(0x8f8e96),
    btn: Color.fromHex(0x5651e1),
  };

  static readonly Player1: PlayerColorPalette = {
    primary: Color.fromHex(0xeef900),
    secondary: Color.fromHex(0xffa904),
    fire: {
      center: Color.fromHex(0xfefe05),
      primary: Color.fromRgb01([1.0, 0.9, 0.0]),
      secondary: Color.fromRgb01([0.97, 0.72, 0.02]),
    },
    spCutIn: {
      fg: {
        primary: Color.fromHex(0xb5ee2f),
        secondary: Color.fromHex(0xeaff3a),
      },
      bg: Color.fromHex(0x97d84c),
      ink: Color.fromHex(0xe8ffca),
      img: Color.fromHex(0xe9ff32),
    },
    szMeter: {
      bg: Color.fromHex(0x969f48),
      fg: Color.fromHex(0xe6fe6a),
    },
  };

  static readonly Player2: PlayerColorPalette = {
    primary: Color.fromHex(0x485aff),
    secondary: Color.fromHex(0x09ecff),
    fire: {
      center: Color.fromHex(0xfcfcfc),
      primary: Color.fromRgb255([240, 255, 252]),
      secondary: Color.fromRgb255([170, 251, 255]),
    },
    spCutIn: {
      fg: {
        primary: Color.fromHex(0x4732c6),
        secondary: Color.fromHex(0x5f3aff),
      },
      bg: Color.fromHex(0x5827a3),
      ink: Color.fromHex(0xb588fd),
      img: Color.fromHex(0x5011ff),
    },
    szMeter: {
      bg: Color.fromHex(0x2d1883),
      fg: Color.fromHex(0x8255fd),
    },
  };
}
