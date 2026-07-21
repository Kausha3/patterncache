/**
 * CheerpJ runtime blocks used by a complete ECJ compile plus JVM test run.
 *
 * Captured with cjGetRuntimeResources() on 2026-07-21 after Coding Combat's
 * generated harness passed. Supplying this measured profile lets CheerpJ load
 * the required Java 8 modules in parallel instead of discovering them one by
 * one during a learner's first compilation.
 */
export const JAVA_RUNTIME_PRELOAD_RESOURCES: Record<string, number[]> = {
  "/lt/8/jre/lib/rt.jar": [
    0, 131072, 10223616, 11665408, 11796480, 12582912, 13238272, 13369344,
    15204352, 15335424, 15466496, 15597568, 17694720, 17825792, 18350080,
    18612224, 18743296, 18874368, 19005440, 19136512, 19398656, 19922944,
    20054016, 20709376, 20840448, 20971520, 21102592, 21757952, 21889024,
    22020096, 22151168, 22937600, 23068672, 27000832,
  ],
  "/lt/etc/users": [0, 131072],
  "/lt/etc/localtime": [],
  "/lt/8/jre/lib/cheerpj-awt.jar": [0, 131072],
  "/lt/8/lib/ext/meta-index": [0, 131072],
  "/lt/8/lib/ext": [],
  "/lt/8/lib/ext/index.list": [],
  "/lt/8/lib/ext/localedata.jar": [0, 131072, 1048576, 1179648],
  "/lt/8/jre/lib/jsse.jar": [0, 131072, 786432, 917504],
  "/lt/8/jre/lib/jce.jar": [0, 131072],
  "/lt/8/jre/lib/charsets.jar": [0, 131072, 1703936, 1835008],
  "/lt/8/jre/lib/resources.jar": [0, 131072, 917504, 1179648],
  "/lt/8/jre/lib/javaws.jar": [0, 131072, 1441792, 1703936],
  "/lt/8/lib/ext/sunec.jar": [0, 131072],
  "/lt/8/lib/ext/sunjce_provider.jar": [0, 262144],
  "/lt/8/lib/ext/zipfs.jar": [0, 131072],
  "/lt/8/lib/security/java.security": [0, 131072],
  "/lt/8/jre/lib/meta-index": [0, 131072],
  "/lt/8/jre/lib": [],
  "/lt/8": [],
  "/lt/8/lib/endorsed": [],
};
