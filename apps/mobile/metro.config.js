// Metro num monorepo npm workspaces.
//
// Sem isto o bundler nao enxerga o node_modules hoisted na raiz e quebra com
// "Unable to resolve module react" na primeira importacao.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// Evita duas copias de react/react-native quando algo nao hoista.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
