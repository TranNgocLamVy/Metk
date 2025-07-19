module.exports = {
  rules: {
    "no-restricted-imports": [
      "error",
      {
        "paths": [
          {
            "name": "@radix-ui/react-tooltip",
            "message": "Do not use Radix Tooltip. Use internal UI components instead."
          }
        ],
        "patterns": ["@radix-ui/*"]
      }
    ]
  }
};
