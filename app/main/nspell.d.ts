declare module 'nspell' {
  function nspell(aff: Buffer, dic: Buffer): { correct(word: string): boolean; suggest(word: string): string[] };
  export default nspell;
}
