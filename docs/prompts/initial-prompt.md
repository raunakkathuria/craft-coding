We have business rules and business config provided by our API, which change rarely, we are thinking of serving them as static JS files over CDN

Sample response from one of the API

```
{"data":[{"account":{"specification":{"display_name":"Standard","information":"Trade CFDs with competitive spreads and swap fees.","markets_offered":["Forex","Stock Indices","Commodities","Energies","Cryptocurrencies","ETFs"],"max_leverage":500,"pips":0.6}}},{"account":{"specification":{"display_name":"Swap-Free","information":"Hold positions without overnight charges.","markets_offered":["Forex","Stock Indices","Commodities","Energies","Cryptocurrencies","ETFs"],"max_leverage":500,"pips":2.2}}}]}
```

How can this be achieved?  

We were thinking of using GitHub Actions to run this daily and push to Cloudflare CDN, and we may extend this in future to bring more endpoints 

Is this a good approach? Any other alternative?

Think and provide possible alternatives and a recommended approach. Ask questions if any clarification is needed.
