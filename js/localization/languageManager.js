/*
 ***********************************************************************
 * FILE: languageManager.js
 *
 * PURPOSE
 * Handles ShopMate localization without language-specific application code.
 *
 * IMPORTANT
 * Adding a new language requires adding its dictionary file to:
 *
 * js/localization/languages/
 *
 * Example:
 * en -> english.js
 * fr -> french.js
 * ta -> tamil.js
 ***********************************************************************
 */
/* Language Dictionary Configuration */
const languageDictionaryFiles = {
  en: "english.js",
  fr: "french.js",
  ta: "tamil.js",
};
/* Language Dictionary Registry */
const languageRegistry = {};
/* Register Language - Called automatically by each language dictionary. */
function registerLanguage(languageCode, dictionary) {
  const normalizedLanguageCode = String(languageCode || "")
    .toLowerCase()
    .trim();
  if (!normalizedLanguageCode || !dictionary) {
    return;
  }
  languageRegistry[normalizedLanguageCode] = dictionary;
}
/* Check Language Registration */
function isLanguageRegistered(languageCode) {
  const normalizedLanguageCode = String(languageCode || "")
    .toLowerCase()
    .trim();
  return Object.prototype.hasOwnProperty.call(
    languageRegistry,
    normalizedLanguageCode,
  );
}
/* Get Registered Language */
function getRegisteredLanguage(languageCode) {
  const normalizedLanguageCode = String(languageCode || "")
    .toLowerCase()
    .trim();
  return languageRegistry[normalizedLanguageCode] || null;
}
/* Active Translation Dictionary */
let currentTranslations = {};
/* English Fallback Dictionary */
let fallbackTranslations = {};
/* Current Language */
let currentLanguage = "en";
/* Loaded Dictionary Promises */
const dictionaryLoadPromises = {};
/* Get Language Code */
function getCurrentLanguageCode() {
  if (
    typeof appState === "undefined" ||
    !appState.settings ||
    !appState.settings.language
  ) {
    return "en";
  }
  return appState.settings.language;
}
/* Get Dictionary Base URL */
function getDictionaryBaseUrl() {
  const languageManagerScript = Array.from(
    document.querySelectorAll("script"),
  ).find(function (script) {
    return script.src.includes("languageManager.js");
  });
  if (!languageManagerScript) {
    return "../js/localization/languages/";
  }
  return new URL("./languages/", languageManagerScript.src).href;
}
/* Validate Language Code */
function isValidLanguageCode(languageCode) {
  return typeof languageCode === "string" && /^[a-z]{2}$/i.test(languageCode);
}
/* Get Dictionary File Name */
function getDictionaryFileName(languageCode) {
  const normalizedLanguageCode = String(languageCode || "en").toLowerCase();
  return languageDictionaryFiles[normalizedLanguageCode] || null;
}
/* Load Dictionary File */
function loadDictionaryFile(languageCode) {
  const normalizedLanguageCode = String(languageCode || "en").toLowerCase();
  if (!isValidLanguageCode(normalizedLanguageCode)) {
    return Promise.reject(
      new Error("Invalid language code: " + normalizedLanguageCode),
    );
  }
  const dictionaryFileName = getDictionaryFileName(normalizedLanguageCode);
  if (!dictionaryFileName) {
    return Promise.reject(
      new Error(
        "Language dictionary is not registered: " + normalizedLanguageCode,
      ),
    );
  }
  /*
   * If the dictionary has already registered itself,
   * return it immediately.
   */
  if (isLanguageRegistered(normalizedLanguageCode)) {
    return Promise.resolve(getRegisteredLanguage(normalizedLanguageCode));
  }
  /*
   * Prevent the same dictionary from being loaded
   * multiple times simultaneously.
   */
  if (dictionaryLoadPromises[normalizedLanguageCode]) {
    return dictionaryLoadPromises[normalizedLanguageCode];
  }
  dictionaryLoadPromises[normalizedLanguageCode] = new Promise(function (
    resolve,
    reject,
  ) {
    const script = document.createElement("script");
    script.src = getDictionaryBaseUrl() + dictionaryFileName;
    script.async = false;
    script.onload = function () {
      if (isLanguageRegistered(normalizedLanguageCode)) {
        resolve(getRegisteredLanguage(normalizedLanguageCode));
        return;
      }
      reject(
        new Error(
          "Language dictionary did not register: " + normalizedLanguageCode,
        ),
      );
    };
    script.onerror = function () {
      reject(
        new Error(
          "Unable to load language dictionary: " + normalizedLanguageCode,
        ),
      );
    };
    document.head.appendChild(script);
  }).catch(function (error) {
    delete dictionaryLoadPromises[normalizedLanguageCode];
    throw error;
  });
  return dictionaryLoadPromises[normalizedLanguageCode];
}
/* Load Language */
async function loadLanguage(languageCode) {
  let requestedLanguage = (
    languageCode ||
    getCurrentLanguageCode() ||
    "en"
  ).toLowerCase();
  if (!isValidLanguageCode(requestedLanguage)) {
    requestedLanguage = "en";
  }
  try {
    currentTranslations = await loadDictionaryFile(requestedLanguage);
    currentLanguage = requestedLanguage;
  } catch (error) {
    console.warn("Unable to load language:", requestedLanguage, error);
    /*
     * If the requested language cannot be loaded,
     * fall back to English.
     */
    if (requestedLanguage !== "en") {
      try {
        currentTranslations = await loadDictionaryFile("en");
      } catch (fallbackError) {
        console.error(
          "Unable to load English fallback dictionary.",
          fallbackError,
        );
        currentTranslations = {};
      }
    } else {
      currentTranslations = {};
    }
    currentLanguage = "en";
  }
  /*
   * English itself becomes the fallback dictionary.
   */
  if (currentLanguage === "en") {
    fallbackTranslations = currentTranslations;
  } else {
    try {
      fallbackTranslations = await loadDictionaryFile("en");
    } catch (error) {
      console.warn("Unable to load English fallback dictionary.", error);
      fallbackTranslations = {};
    }
  }
  return currentTranslations;
}
/* Get Nested Translation Value */
function getTranslationValue(dictionary, key) {
  if (!dictionary || !key) {
    return null;
  }
  const keys = key.split(".");
  let value = dictionary;
  for (const item of keys) {
    if (
      value === null ||
      value === undefined ||
      typeof value !== "object" ||
      !Object.prototype.hasOwnProperty.call(value, item)
    ) {
      return null;
    }
    value = value[item];
  }
  return value;
}
/* Get Translation */
function t(key, params) {
  if (!key) {
    return "";
  }
  let translatedValue = getTranslationValue(currentTranslations, key);
  if (translatedValue === null || translatedValue === undefined) {
    translatedValue = getTranslationValue(fallbackTranslations, key);
  }
  if (translatedValue === null || translatedValue === undefined) {
    return key;
  }
  if (typeof translatedValue !== "string") {
    return translatedValue;
  }
  if (params) {
    Object.keys(params).forEach(function (paramKey) {
      translatedValue = translatedValue.replace(
        new RegExp("\\{\\{" + paramKey + "\\}\\}", "g"),
        String(params[paramKey]),
      );
    });
  }
  return translatedValue;
}
/* Translate Page */
function translatePage() {
  document.querySelectorAll("[data-i18n]").forEach(function (element) {
    element.textContent = t(element.dataset.i18n);
  });
  document
    .querySelectorAll("[data-i18n-placeholder]")
    .forEach(function (element) {
      element.placeholder = t(element.dataset.i18nPlaceholder);
    });
  const pageTitle = document.querySelector("title[data-i18n]");
  if (pageTitle) {
    pageTitle.textContent = t(pageTitle.dataset.i18n);
  }
  document.documentElement.lang = currentLanguage;
}
/* Notify Application About Language Change */
function notifyLanguageChanged() {
  window.dispatchEvent(
    new CustomEvent("shopMateLanguageChanged", {
      detail: {
        language: currentLanguage,
      },
    }),
  );
}
/* Initialize Localization */
async function initializeLocalization() {
  await loadLanguage();
  translatePage();
}
/* Change Language */
async function changeLanguage(languageCode) {
  if (!languageCode) {
    return;
  }
  await loadLanguage(languageCode);
  if (typeof appState !== "undefined") {
    if (!appState.settings) {
      appState.settings = {};
    }
    appState.settings.language = currentLanguage;
    if (typeof saveAppState === "function") {
      saveAppState();
    }
  }
  translatePage();
  notifyLanguageChanged();
}
