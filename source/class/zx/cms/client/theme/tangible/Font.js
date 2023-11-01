/* ************************************************************************
 *
 *  Zen [and the art of] CMS
 *
 *  https://zenesis.com
 *
 *  Copyright:
 *    2019-2022 Zenesis Ltd, https://www.zenesis.com
 *
 *  License:
 *    MIT (see LICENSE in project root)
 *
 *  Authors:
 *    John Spackman (john.spackman@zenesis.com, @johnspackman)
 *
 * ************************************************************************ */

/**
 * @usefont(Montserrat)
 * @usefont(Roboto Mono)
 */
qx.Theme.define("zx.cms.client.theme.tangible.Font", {
  fonts: {
    default: {
      size: 14,
      family: ["Montserrat", "sans-serif"],
      color: "text-primary-on-surface"
    },

    "controlpanel-button-font": {
      size: 14,
      family: ["Montserrat", "sans-serif"],
      color: "text-primary-on-surface"
    },

    bold: {
      size: 14,
      family: ["Montserrat", "sans-serif"],
      bold: true,
      color: "text-primary-on-surface"
    },

    headline: {
      size: 24,
      family: ["Montserrat", "sans-serif"],
      color: "text-primary-on-surface"
    },

    small: {
      size: 12,
      family: ["Montserrat", "sans-serif"],
      color: "text-primary-on-surface"
    },

    monospace: {
      size: 14,
      family: ["Roboto Mono", "monospace"],
      color: "text-primary-on-surface"
    },

    large: {
      size: 18,
      family: ["Montserrat", "sans-serif"],
      color: "text-primary-on-surface"
    },

    medium: {
      size: 16,
      family: ["Montserrat", "sans-serif"],
      color: "text-primary-on-surface"
    },

    italic: {
      size: 14,
      family: ["Montserrat", "sans-serif"],
      color: "text-primary-on-surface",
      italic: true
    },

    strikeout: {
      size: 14,
      family: ["Montserrat", "sans-serif"],
      color: "text-primary-on-surface",
      decoration: "line-through"
    },

    tiny: {
      size: 9,
      lineHeight: 1,
      family: ["Montserrat", "sans-serif"],
      color: "text-primary-on-surface"
    },

    heading1: {
      size: 24,
      family: ["Montserrat", "sans-serif"],
      color: "text-primary-on-surface"
    },

    heading2: {
      size: 21,
      family: ["Montserrat", "sans-serif"],
      color: "text-primary-on-surface"
    },

    heading3: {
      size: 18,
      family: ["Montserrat", "sans-serif"],
      color: "text-primary-on-surface"
    }
  }
});
