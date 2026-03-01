// .turborc.js - Configurações específicas do Turbopack
module.exports = {
  // Configurações de cache
  cache: {
    // Diretório de cache
    dir: '.turbo',
    // Estratégia de cache
    strategy: 'filesystem',
  },
  
  // Configurações de build
  build: {
    // Paralelização
    parallel: true,
    // Otimizações
    optimize: true,
    // Source maps para desenvolvimento
    sourcemap: process.env.NODE_ENV === 'development',
  },
  
  // Configurações de desenvolvimento
  dev: {
    // Hot reload
    hotReload: true,
    // Fast refresh
    fastRefresh: true,
    // Live reload
    liveReload: true,
  },
  
  // Configurações de performance
  performance: {
    // Lazy compilation
    lazyCompilation: true,
    // Tree shaking
    treeShaking: true,
    // Code splitting
    codeSplitting: true,
  },
  
  // Configurações de resolução de módulos
  resolve: {
    // Extensions
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    // Alias (já configurado no next.config.js)
    alias: {
      '@': './',
    },
  },
  
  // Configurações de loaders
  loaders: {
    // TypeScript
    typescript: {
      transpileOnly: true,
      isolatedModules: true,
    },
    // CSS
    css: {
      modules: true,
      localIdentName: '[name]__[local]___[hash:base64:5]',
    },
  },
}
