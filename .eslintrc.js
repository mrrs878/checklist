/*
 * @Author: mrrs878@foxmail.com
 * @Date: 2022-07-20 20:03:53
 * @LastEditors: mrrs878@foxmail.com
 * @LastEditTime: 2022-07-20 20:32:29
 */

module.exports = {
  extends: 'airbnb-base',
  parserOptions: {
    ecmaVersion: 'latest',
  },
  env: {
    browser: true,
    webextensions: true,
  },
  globals: {
    $: 'readonly',
  },
  ignorePatterns: [
    'jsconfig.json',
  ],
};
