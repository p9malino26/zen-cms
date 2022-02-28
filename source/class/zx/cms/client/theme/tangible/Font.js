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

qx.Theme.define("zx.cms.client.theme.tangible.Font", {
  fonts: {
    FontAwesomeBrands: {
      size: 16,
      lineHeight: 1,
      comparisonString: "\uf1e3\uf1f7\uf11b\uf19d",
      family: ["FontAwesomeBrands"],
      sources: [
        {
          family: "FontAwesomeBrands",
          source: ["zx/cms/fontawesome/fa-brands-400.ttf"]
        }
      ]
    },
    FontAwesome: {
      size: 16,
      lineHeight: 1,
      comparisonString: "\uf1e3\uf1f7\uf11b\uf19d",
      family: ["FontAwesomeRegular"],
      sources: [
        {
          family: "FontAwesomeRegular",
          source: ["zx/cms/fontawesome/fa-regular-400.ttf"]
        }
      ]
    },
    FontAwesomeSolid: {
      size: 16,
      lineHeight: 1,
      comparisonString: "\uf1e3\uf1f7\uf11b\uf19d",
      family: ["FontAwesomeSolid"],
      sources: [
        {
          family: "FontAwesomeSolid",
          source: ["zx/cms/fontawesome/fa-solid-900.ttf"]
        }
      ]
    },

    default: {
      size: 14,
      family: ["Montserrat", "sans-serif"],
      color: "text-primary-on-surface",
      weight: "300",
      sources: [
        {
          family: "Montserrat",
          fontWeight: "300",
          source: [
            "zx/cms/Montserrat/Montserrat-Light.woff2",
            "zx/cms/Montserrat/Montserrat-Light.woff",
            "zx/cms/Montserrat/Montserrat-Light.ttf"
          ]
        }
      ]
    },

    "controlpanel-button-font": {
      size: 14,
      family: ["Montserrat", "sans-serif"],
      color: "text-primary-on-surface",
      weight: "300",
      sources: [
        {
          family: "Montserrat",
          fontWeight: "300",
          source: [
            "zx/cms/Montserrat/Montserrat-Light.woff2",
            "zx/cms/Montserrat/Montserrat-Light.woff",
            "zx/cms/Montserrat/Montserrat-Light.ttf"
          ]
        }
      ]
    },

    bold: {
      size: 14,
      family: ["Montserrat", "sans-serif"],
      bold: true,
      color: "text-primary-on-surface",
      weight: "500",
      sources: [
        {
          family: "Montserrat",
          fontWeight: "500",
          source: [
            "zx/cms/Montserrat/Montserrat-Medium.eot",
            "zx/cms/Montserrat/Montserrat-Medium.woff2",
            "zx/cms/Montserrat/Montserrat-Medium.woff",
            "zx/cms/Montserrat/Montserrat-Medium.ttf"
          ]
        }
      ]
    },

    headline: {
      size: 24,
      family: ["Montserrat", "sans-serif"],
      color: "text-primary-on-surface",
      sources: [
        {
          family: "Montserrat",
          fontWeight: 300,
          source: [
            "zx/cms/Montserrat/Montserrat-Light.eot",
            "zx/cms/Montserrat/Montserrat-Light.woff2",
            "zx/cms/Montserrat/Montserrat-Light.woff",
            "zx/cms/Montserrat/Montserrat-Light.ttf"
          ]
        }
      ]
    },

    small: {
      size: 12,
      family: ["Montserrat", "sans-serif"],
      color: "text-primary-on-surface",
      sources: [
        {
          family: "Montserrat",
          fontWeight: "300",
          source: [
            "zx/cms/Montserrat/Montserrat-Light.eot",
            "zx/cms/Montserrat/Montserrat-Light.woff2",
            "zx/cms/Montserrat/Montserrat-Light.woff",
            "zx/cms/Montserrat/Montserrat-Light.ttf"
          ]
        }
      ]
    },

    monospace: {
      size: 14,
      family: ["monospace"],
      color: "text-primary-on-surface",
      sources: [
        {
          family: "Roboto Mono",
          source: [
            "qx/font/Roboto/roboto-mono-v6-latin_latin-ext-regular.eot",
            "qx/font/Roboto/roboto-mono-v6-latin_latin-ext-regular.woff2",
            "qx/font/Roboto/roboto-mono-v6-latin_latin-ext-regular.woff",
            "qx/font/Roboto/roboto-mono-v6-latin_latin-ext-regular.ttf"
          ]
        }
      ]
    },

    large: {
      size: 18,
      family: ["Montserrat", "sans-serif"],
      color: "text-primary-on-surface",
      weight: "300",
      sources: [
        {
          family: "Montserrat",
          fontWeight: "300",
          source: [
            "zx/cms/Montserrat/Montserrat-Light.eot",
            "zx/cms/Montserrat/Montserrat-Light.woff2",
            "zx/cms/Montserrat/Montserrat-Light.woff",
            "zx/cms/Montserrat/Montserrat-Light.ttf"
          ]
        }
      ]
    },

    medium: {
      size: 16,
      family: ["Montserrat", "sans-serif"],
      color: "text-primary-on-surface",
      weight: "300",
      sources: [
        {
          family: "Montserrat",
          fontWeight: "300",
          source: [
            "zx/cms/Montserrat/Montserrat-Light.eot",
            "zx/cms/Montserrat/Montserrat-Light.woff2",
            "zx/cms/Montserrat/Montserrat-Light.woff",
            "zx/cms/Montserrat/Montserrat-Light.ttf"
          ]
        }
      ]
    },

    italic: {
      size: 14,
      family: ["Montserrat", "sans-serif"],
      color: "text-primary-on-surface",
      weight: "300",
      sources: [
        {
          family: "Montserrat",
          fontWeight: "300",
          fontStyle: "italic",
          source: [
            "zx/cms/Montserrat/Montserrat-LightItalic.eot",
            "zx/cms/Montserrat/Montserrat-LightItalic.woff2",
            "zx/cms/Montserrat/Montserrat-LightItalic.woff",
            "zx/cms/Montserrat/Montserrat-LightItalic.ttf"
          ]
        }
      ],
      italic: true
    },

    strikeout: {
      size: 14,
      family: ["Montserrat", "sans-serif"],
      color: "text-primary-on-surface",
      weight: "300",
      sources: [
        {
          family: "Montserrat",
          fontWeight: "300",
          source: [
            "zx/cms/Montserrat/Montserrat-Light.eot",
            "zx/cms/Montserrat/Montserrat-Light.woff2",
            "zx/cms/Montserrat/Montserrat-Light.woff",
            "zx/cms/Montserrat/Montserrat-Light.ttf"
          ]
        }
      ],
      decoration: "line-through"
    },

    tiny: {
      size: 9,
      lineHeight: 1,
      family: ["Montserrat", "sans-serif"],
      color: "text-primary-on-surface",
      weight: "300",
      sources: [
        {
          family: "Montserrat",
          fontWeight: "300",
          source: [
            "zx/cms/Montserrat/Montserrat-Light.eot",
            "zx/cms/Montserrat/Montserrat-Light.woff2",
            "zx/cms/Montserrat/Montserrat-Light.woff",
            "zx/cms/Montserrat/Montserrat-Light.ttf"
          ]
        }
      ]
    },

    heading1: {
      size: 24,
      family: ["Montserrat", "sans-serif"],
      color: "text-primary-on-surface",
      weight: "300",
      sources: [
        {
          family: "Montserrat",
          fontWeight: "300",
          source: [
            "zx/cms/Montserrat/Montserrat-Light.eot",
            "zx/cms/Montserrat/Montserrat-Light.woff2",
            "zx/cms/Montserrat/Montserrat-Light.woff",
            "zx/cms/Montserrat/Montserrat-Light.ttf"
          ]
        }
      ]
    },

    heading2: {
      size: 21,
      family: ["Montserrat", "sans-serif"],
      color: "text-primary-on-surface",
      weight: "300",
      sources: [
        {
          family: "Montserrat",
          fontWeight: "300",
          source: [
            "zx/cms/Montserrat/Montserrat-Light.eot",
            "zx/cms/Montserrat/Montserrat-Light.woff2",
            "zx/cms/Montserrat/Montserrat-Light.woff",
            "zx/cms/Montserrat/Montserrat-Light.ttf"
          ]
        }
      ]
    },

    heading3: {
      size: 18,
      family: ["Montserrat", "sans-serif"],
      color: "text-primary-on-surface",
      weight: "300",
      sources: [
        {
          family: "Montserrat",
          fontWeight: "300",
          source: [
            "zx/cms/Montserrat/Montserrat-Light.eot",
            "zx/cms/Montserrat/Montserrat-Light.woff2",
            "zx/cms/Montserrat/Montserrat-Light.woff",
            "zx/cms/Montserrat/Montserrat-Light.ttf"
          ]
        }
      ]
    }
  }
});
