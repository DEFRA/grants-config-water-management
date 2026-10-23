# Legal Status Codes

Please see the following for a handy lookup guide.

```json
{
  "data": {
    "referenceData": {
      "legalStatuses": [
        {
          "description": "Charitable Incorporated Organisation (CIO)",
          "code": 102101
        },
        {
          "description": "Community Interest Company (CIC)",
          "code": 102102
        },
        {
          "description": "Government (Central)",
          "code": 102103
        },
        {
          "description": "Government (Local)",
          "code": 102104
        },
        {
          "description": "Limited Liability Partnership (LLP)",
          "code": 102105
        },
        {
          "description": "Limited Partnership (LP)",
          "code": 102106
        },
        {
          "description": "Non-UK Company",
          "code": 102107
        },
        {
          "description": "Partnership",
          "code": 102108
        },
        {
          "description": "Private Limited Company (Ltd)",
          "code": 102109
        },
        {
          "description": "Public Limited Company (PLC)",
          "code": 102110
        },
        {
          "description": "Sole Proprietorship",
          "code": 102111
        },
        {
          "description": "The Crown",
          "code": 102112
        },
        {
          "description": "Charitable Trust",
          "code": 102113
        },
        {
          "description": "Unlimited Company (Ultd)",
          "code": 102114
        }
      ]
    }
  }
}
```
The live list (unlikely to change but just in case) is available by querying the DAL using:

```
query LegalStatuses
{
  referenceData
  {
    legalStatuses {
      description
      code
    }
  }
}
```
