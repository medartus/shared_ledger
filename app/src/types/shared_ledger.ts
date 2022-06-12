export type SharedLedger = {
  "version": "0.1.0",
  "name": "shared_ledger",
  "instructions": [
    {
      "name": "createNotificationCredential",
      "accounts": [
        {
          "name": "author",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "credential",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "content",
          "type": {
            "defined": "ContentType"
          }
        },
        {
          "name": "hash",
          "type": "string"
        }
      ]
    },
    {
      "name": "createTransferRequest",
      "accounts": [
        {
          "name": "transfer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "requester",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "uuid",
          "type": "publicKey"
        },
        {
          "name": "topic",
          "type": "string"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "executeTransferRequest",
      "accounts": [
        {
          "name": "requester",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "transfer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "uuid",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "cancelTransferRequest",
      "accounts": [
        {
          "name": "requester",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "transfer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "uuid",
          "type": "publicKey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "transfer",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "from",
            "type": "publicKey"
          },
          {
            "name": "to",
            "type": "publicKey"
          },
          {
            "name": "uuid",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "events",
            "type": {
              "array": [
                {
                  "defined": "TransactionEvent"
                },
                2
              ]
            }
          },
          {
            "name": "topic",
            "type": "string"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "contentCredential",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "content",
            "type": {
              "defined": "ContentType"
            }
          },
          {
            "name": "hash",
            "type": "string"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "TransactionEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "eventType",
            "type": {
              "defined": "TransactionEventType"
            }
          }
        ]
      }
    },
    {
      "name": "ContentType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "EMAIL"
          }
        ]
      }
    },
    {
      "name": "TransactionEventType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "UNDEFINED"
          },
          {
            "name": "CREATION"
          },
          {
            "name": "CANCEL"
          },
          {
            "name": "TRANSFER"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "CanceledTransfer",
      "msg": "Can't process a canceled transfer request"
    },
    {
      "code": 6001,
      "name": "ProcessedTransfer",
      "msg": "Can't process again a transfer request"
    },
    {
      "code": 6002,
      "name": "UnknownTransfer",
      "msg": "Can't process an unkonwn processed transfer request"
    },
    {
      "code": 6003,
      "name": "TopicTooLong",
      "msg": "The provided topic should be 50 characters long maximum"
    },
    {
      "code": 6004,
      "name": "HashTooLong",
      "msg": "The provided Hash should be 64 characters long maximum"
    },
    {
      "code": 6005,
      "name": "NeedPositiveAmount",
      "msg": "The amount provided needs to be positive"
    }
  ]
};

export const IDL: SharedLedger = {
  "version": "0.1.0",
  "name": "shared_ledger",
  "instructions": [
    {
      "name": "createNotificationCredential",
      "accounts": [
        {
          "name": "author",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "credential",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "content",
          "type": {
            "defined": "ContentType"
          }
        },
        {
          "name": "hash",
          "type": "string"
        }
      ]
    },
    {
      "name": "createTransferRequest",
      "accounts": [
        {
          "name": "transfer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "requester",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "uuid",
          "type": "publicKey"
        },
        {
          "name": "topic",
          "type": "string"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "executeTransferRequest",
      "accounts": [
        {
          "name": "requester",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "transfer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "uuid",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "cancelTransferRequest",
      "accounts": [
        {
          "name": "requester",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "transfer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "uuid",
          "type": "publicKey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "transfer",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "from",
            "type": "publicKey"
          },
          {
            "name": "to",
            "type": "publicKey"
          },
          {
            "name": "uuid",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "events",
            "type": {
              "array": [
                {
                  "defined": "TransactionEvent"
                },
                2
              ]
            }
          },
          {
            "name": "topic",
            "type": "string"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "contentCredential",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "content",
            "type": {
              "defined": "ContentType"
            }
          },
          {
            "name": "hash",
            "type": "string"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "TransactionEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "eventType",
            "type": {
              "defined": "TransactionEventType"
            }
          }
        ]
      }
    },
    {
      "name": "ContentType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "EMAIL"
          }
        ]
      }
    },
    {
      "name": "TransactionEventType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "UNDEFINED"
          },
          {
            "name": "CREATION"
          },
          {
            "name": "CANCEL"
          },
          {
            "name": "TRANSFER"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "CanceledTransfer",
      "msg": "Can't process a canceled transfer request"
    },
    {
      "code": 6001,
      "name": "ProcessedTransfer",
      "msg": "Can't process again a transfer request"
    },
    {
      "code": 6002,
      "name": "UnknownTransfer",
      "msg": "Can't process an unkonwn processed transfer request"
    },
    {
      "code": 6003,
      "name": "TopicTooLong",
      "msg": "The provided topic should be 50 characters long maximum"
    },
    {
      "code": 6004,
      "name": "HashTooLong",
      "msg": "The provided Hash should be 64 characters long maximum"
    },
    {
      "code": 6005,
      "name": "NeedPositiveAmount",
      "msg": "The amount provided needs to be positive"
    }
  ]
};
