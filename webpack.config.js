const path = require('path');

module.exports = {
    mode: 'production',
    entry: './src/main.js', 
    output: {
        path: path.resolve(__dirname, 'demo'), 
        filename: 'bundle.[contenthash].js', 
        clean: true 
    },
    module: {
        rules: [
            {
              
            }
           
        ]
    }
};
