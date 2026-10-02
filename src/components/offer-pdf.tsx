// The offer PDF lives in ./offer-pdf/. This file keeps the import path that load-offer-pdf.ts resolves; it must only ever be loaded in the browser.
export { OfferDocument, createOfferBlob, downloadOffer } from "./offer-pdf/index";
