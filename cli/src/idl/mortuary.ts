export type Mortuary = {
  "version": "0.3.0",
  "name": "mortuary",
  "instructions": [
    {
      "name": "initializeMaster",
      "accounts": [
        {
          "name": "masterAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "initializer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "bank",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "updateMaster",
      "accounts": [
        {
          "name": "masterAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "initializer",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "goLiveDate",
          "type": {
            "option": "i64"
          }
        },
        {
          "name": "burnFrequency",
          "type": {
            "option": "u32"
          }
        },
        {
          "name": "ashByBurn",
          "type": {
            "option": "u32"
          }
        },
        {
          "name": "checks",
          "type": {
            "option": "u32"
          }
        }
      ]
    },
    {
      "name": "withdrawMaster",
      "accounts": [
        {
          "name": "masterAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "initializer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "bank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ownerTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pdaAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeVoxelBurn",
      "accounts": [
        {
          "name": "voxelBurnAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "voxelMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "voxelAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "voxelMetadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "masterAccount",
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
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "plotSize",
          "type": "u8"
        }
      ]
    },
    {
      "name": "doVoxelBurn2",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "voxelBurnAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "voxelAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "masterAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pdaAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftBurnAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftBurnMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftBurnMetadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftBurnEdition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ashTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
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
          "name": "flags",
          "type": "u32"
        }
      ]
    },
    {
      "name": "doVoxelBurn3",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "voxelBurnAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "voxelAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "masterAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pdaAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftBurnAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftBurnMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftBurnMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftBurnEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ashTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadataProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "flags",
          "type": "u32"
        }
      ]
    },
    {
      "name": "setVoxelBurnTax",
      "accounts": [
        {
          "name": "voxelBurnAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "voxelMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "voxelAccount",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "tax",
          "type": "u8"
        }
      ]
    },
    {
      "name": "createBooster",
      "accounts": [
        {
          "name": "booster",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "masterAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "initializer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "updateBooster",
      "accounts": [
        {
          "name": "booster",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "initializer",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "id",
          "type": {
            "option": "u8"
          }
        },
        {
          "name": "creator",
          "type": {
            "option": "publicKey"
          }
        },
        {
          "name": "name",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "ashMultiplicator",
          "type": {
            "option": "u8"
          }
        },
        {
          "name": "ashByBurn",
          "type": {
            "option": "u32"
          }
        },
        {
          "name": "ashIfBurn",
          "type": {
            "option": "u32"
          }
        },
        {
          "name": "checkSigned",
          "type": {
            "option": "bool"
          }
        }
      ]
    },
    {
      "name": "initializeBurnParty",
      "accounts": [
        {
          "name": "initializer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "burnerPayoutAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "holderPayoutAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "partyAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "BurnPartyParams"
          }
        }
      ]
    },
    {
      "name": "doPartyBurn",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "partyAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "burnerPayoutAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "holderPayoutAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pdaBurnerPayoutAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pdaHolderPayoutAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "masterAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "voxelBurnAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "master",
            "type": "publicKey"
          },
          {
            "name": "lastBurn",
            "type": {
              "array": [
                "u32",
                10
              ]
            }
          },
          {
            "name": "share",
            "type": "u8"
          },
          {
            "name": "plotSize",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "burnPartyAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mode",
            "type": "u8"
          },
          {
            "name": "collection",
            "type": "publicKey"
          },
          {
            "name": "burnInARow",
            "type": "u8"
          },
          {
            "name": "burnerPayout",
            "type": "u8"
          },
          {
            "name": "burnerPayoutAccount",
            "type": "publicKey"
          },
          {
            "name": "holderPayout",
            "type": "u8"
          },
          {
            "name": "holderPayoutAccount",
            "type": "publicKey"
          },
          {
            "name": "startAt",
            "type": "i64"
          },
          {
            "name": "endAt",
            "type": "i64"
          },
          {
            "name": "maxBurn",
            "type": "u32"
          },
          {
            "name": "totalBurn",
            "type": "u32"
          },
          {
            "name": "initializer",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "boosterAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "initializer",
            "type": "publicKey"
          },
          {
            "name": "id",
            "type": "u8"
          },
          {
            "name": "creator",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "name",
            "type": {
              "option": {
                "array": [
                  "u8",
                  32
                ]
              }
            }
          },
          {
            "name": "ashMultiplicator",
            "type": "u8"
          },
          {
            "name": "ashByBurn",
            "type": "u32"
          },
          {
            "name": "ashIfBurn",
            "type": "u32"
          },
          {
            "name": "checkSigned",
            "type": "bool"
          },
          {
            "name": "reserved0",
            "type": "u32"
          },
          {
            "name": "reserved1",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "mortuaryMasterAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "initializer",
            "type": "publicKey"
          },
          {
            "name": "bank",
            "type": "publicKey"
          },
          {
            "name": "treasury",
            "type": "publicKey"
          },
          {
            "name": "goLiveDate",
            "type": "i64"
          },
          {
            "name": "burnFrequency",
            "type": "u32"
          },
          {
            "name": "ashByBurn",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "checks",
            "type": "u32"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "BurnPartyParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mode",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "collection",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "burnInARow",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "burnerPayout",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "holderPayout",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "startAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "endAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "maxBurn",
            "type": {
              "option": "u32"
            }
          }
        ]
      }
    },
    {
      "name": "Checks",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "HasMetadata"
          },
          {
            "name": "BurnFacilityLive"
          },
          {
            "name": "VoxelBurnLive"
          },
          {
            "name": "CreatorSigned"
          },
          {
            "name": "MasterEdition"
          }
        ]
      }
    },
    {
      "name": "ExtraAccount",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "TaxOwner"
          },
          {
            "name": "Booster"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "BurnFacilityNotLive",
      "msg": "Burn facility is not live yet"
    },
    {
      "code": 6001,
      "name": "TreasuryOutOfAsh",
      "msg": "Treasury out of $ASH"
    },
    {
      "code": 6002,
      "name": "WrongMasterAccount",
      "msg": "Wrong master account"
    },
    {
      "code": 6003,
      "name": "WrongBankAccount",
      "msg": "Wrong bank account"
    },
    {
      "code": 6004,
      "name": "DailyBurnConsumed",
      "msg": "Burn rate limit exceeded"
    },
    {
      "code": 6005,
      "name": "NumericalOverflowError",
      "msg": "Numerical overflow error!"
    },
    {
      "code": 6006,
      "name": "InvalidMetadataKey",
      "msg": "Metadata's key does not match"
    },
    {
      "code": 6007,
      "name": "MintMismatch",
      "msg": "Mint given does not match mint on Metadata"
    },
    {
      "code": 6008,
      "name": "IncorrectOwner",
      "msg": "Incorrect account owner"
    },
    {
      "code": 6009,
      "name": "IncorrectTokenQuantity",
      "msg": "Incorrect token quantity"
    },
    {
      "code": 6010,
      "name": "IncorrectCreator",
      "msg": "Incorrect creator"
    },
    {
      "code": 6011,
      "name": "IncorrectPlotSize",
      "msg": "Incorrect plot size"
    },
    {
      "code": 6012,
      "name": "PlotSizeMismatch",
      "msg": "Plot size mismatch"
    },
    {
      "code": 6013,
      "name": "NotABooster",
      "msg": "Not a booster"
    },
    {
      "code": 6014,
      "name": "AshTokenOwnerNotMatchingPlotOwner",
      "msg": "Ash token owner not matching plot owner"
    },
    {
      "code": 6015,
      "name": "UserNotVoxelOwner",
      "msg": "User is not the voxel owner"
    },
    {
      "code": 6016,
      "name": "VoxelNftNotOwnedByUser",
      "msg": "Voxel NFT is not owned by user"
    },
    {
      "code": 6017,
      "name": "BurnedNftNotOwnedByUser",
      "msg": "Burned NFT is not owned by user"
    },
    {
      "code": 6018,
      "name": "BoosterNftNotOwnedByUser",
      "msg": "Booster NFT is not owned by user"
    },
    {
      "code": 6019,
      "name": "NotSplToken",
      "msg": "Not a spl-token"
    },
    {
      "code": 6020,
      "name": "NotMetaplexMetadata",
      "msg": "Not a metaplex metadata"
    },
    {
      "code": 6021,
      "name": "NotMincAccount",
      "msg": "Not Mortuary-inc data"
    },
    {
      "code": 6022,
      "name": "TaxAccountNotProvided",
      "msg": "Tax account not provided"
    },
    {
      "code": 6023,
      "name": "PlotSharingNotEnable",
      "msg": "Plot sharing is not enable"
    },
    {
      "code": 6024,
      "name": "NotMetaplexEdition",
      "msg": "Not a metaplex edition"
    },
    {
      "code": 6025,
      "name": "InvalidEditionKey",
      "msg": "Edition's key does not match"
    },
    {
      "code": 6026,
      "name": "InvalidEditionMaxSupply",
      "msg": "Invalid edition max supply"
    },
    {
      "code": 6027,
      "name": "MasterEditionIsNotTheMintAuthority",
      "msg": "Master edition is not the mint authority"
    },
    {
      "code": 6028,
      "name": "MasterEditionInvalid",
      "msg": "Master edition invalid"
    },
    {
      "code": 6029,
      "name": "NotRentExempt",
      "msg": "Not Rent Exempt"
    },
    {
      "code": 6030,
      "name": "CollectionAccountNotProvided",
      "msg": "Collection account not provided"
    },
    {
      "code": 6031,
      "name": "InvalidTaxAmount",
      "msg": "Tax amount invalid"
    },
    {
      "code": 6032,
      "name": "BurnNotOpen",
      "msg": "Burn not open"
    },
    {
      "code": 6033,
      "name": "BurnClose",
      "msg": "Burn close"
    },
    {
      "code": 6034,
      "name": "VoxelNftNotOwnedByCollector",
      "msg": "Voxel NFT is not owned by collector"
    }
  ]
};

export const IDL: Mortuary = {
  "version": "0.3.0",
  "name": "mortuary",
  "instructions": [
    {
      "name": "initializeMaster",
      "accounts": [
        {
          "name": "masterAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "initializer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "bank",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "updateMaster",
      "accounts": [
        {
          "name": "masterAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "initializer",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "goLiveDate",
          "type": {
            "option": "i64"
          }
        },
        {
          "name": "burnFrequency",
          "type": {
            "option": "u32"
          }
        },
        {
          "name": "ashByBurn",
          "type": {
            "option": "u32"
          }
        },
        {
          "name": "checks",
          "type": {
            "option": "u32"
          }
        }
      ]
    },
    {
      "name": "withdrawMaster",
      "accounts": [
        {
          "name": "masterAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "initializer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "bank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ownerTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pdaAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeVoxelBurn",
      "accounts": [
        {
          "name": "voxelBurnAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "voxelMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "voxelAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "voxelMetadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "masterAccount",
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
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "plotSize",
          "type": "u8"
        }
      ]
    },
    {
      "name": "doVoxelBurn2",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "voxelBurnAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "voxelAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "masterAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pdaAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftBurnAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftBurnMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftBurnMetadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftBurnEdition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ashTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
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
          "name": "flags",
          "type": "u32"
        }
      ]
    },
    {
      "name": "doVoxelBurn3",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "voxelBurnAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "voxelAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "masterAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pdaAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftBurnAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftBurnMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftBurnMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftBurnEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ashTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadataProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "flags",
          "type": "u32"
        }
      ]
    },
    {
      "name": "setVoxelBurnTax",
      "accounts": [
        {
          "name": "voxelBurnAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "voxelMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "voxelAccount",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "tax",
          "type": "u8"
        }
      ]
    },
    {
      "name": "createBooster",
      "accounts": [
        {
          "name": "booster",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "masterAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "initializer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "updateBooster",
      "accounts": [
        {
          "name": "booster",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "initializer",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "id",
          "type": {
            "option": "u8"
          }
        },
        {
          "name": "creator",
          "type": {
            "option": "publicKey"
          }
        },
        {
          "name": "name",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "ashMultiplicator",
          "type": {
            "option": "u8"
          }
        },
        {
          "name": "ashByBurn",
          "type": {
            "option": "u32"
          }
        },
        {
          "name": "ashIfBurn",
          "type": {
            "option": "u32"
          }
        },
        {
          "name": "checkSigned",
          "type": {
            "option": "bool"
          }
        }
      ]
    },
    {
      "name": "initializeBurnParty",
      "accounts": [
        {
          "name": "initializer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "burnerPayoutAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "holderPayoutAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "partyAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "BurnPartyParams"
          }
        }
      ]
    },
    {
      "name": "doPartyBurn",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "partyAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "burnerPayoutAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "holderPayoutAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pdaBurnerPayoutAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pdaHolderPayoutAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "masterAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "voxelBurnAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "master",
            "type": "publicKey"
          },
          {
            "name": "lastBurn",
            "type": {
              "array": [
                "u32",
                10
              ]
            }
          },
          {
            "name": "share",
            "type": "u8"
          },
          {
            "name": "plotSize",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "burnPartyAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mode",
            "type": "u8"
          },
          {
            "name": "collection",
            "type": "publicKey"
          },
          {
            "name": "burnInARow",
            "type": "u8"
          },
          {
            "name": "burnerPayout",
            "type": "u8"
          },
          {
            "name": "burnerPayoutAccount",
            "type": "publicKey"
          },
          {
            "name": "holderPayout",
            "type": "u8"
          },
          {
            "name": "holderPayoutAccount",
            "type": "publicKey"
          },
          {
            "name": "startAt",
            "type": "i64"
          },
          {
            "name": "endAt",
            "type": "i64"
          },
          {
            "name": "maxBurn",
            "type": "u32"
          },
          {
            "name": "totalBurn",
            "type": "u32"
          },
          {
            "name": "initializer",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "boosterAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "initializer",
            "type": "publicKey"
          },
          {
            "name": "id",
            "type": "u8"
          },
          {
            "name": "creator",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "name",
            "type": {
              "option": {
                "array": [
                  "u8",
                  32
                ]
              }
            }
          },
          {
            "name": "ashMultiplicator",
            "type": "u8"
          },
          {
            "name": "ashByBurn",
            "type": "u32"
          },
          {
            "name": "ashIfBurn",
            "type": "u32"
          },
          {
            "name": "checkSigned",
            "type": "bool"
          },
          {
            "name": "reserved0",
            "type": "u32"
          },
          {
            "name": "reserved1",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "mortuaryMasterAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "initializer",
            "type": "publicKey"
          },
          {
            "name": "bank",
            "type": "publicKey"
          },
          {
            "name": "treasury",
            "type": "publicKey"
          },
          {
            "name": "goLiveDate",
            "type": "i64"
          },
          {
            "name": "burnFrequency",
            "type": "u32"
          },
          {
            "name": "ashByBurn",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "checks",
            "type": "u32"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "BurnPartyParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mode",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "collection",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "burnInARow",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "burnerPayout",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "holderPayout",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "startAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "endAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "maxBurn",
            "type": {
              "option": "u32"
            }
          }
        ]
      }
    },
    {
      "name": "Checks",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "HasMetadata"
          },
          {
            "name": "BurnFacilityLive"
          },
          {
            "name": "VoxelBurnLive"
          },
          {
            "name": "CreatorSigned"
          },
          {
            "name": "MasterEdition"
          }
        ]
      }
    },
    {
      "name": "ExtraAccount",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "TaxOwner"
          },
          {
            "name": "Booster"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "BurnFacilityNotLive",
      "msg": "Burn facility is not live yet"
    },
    {
      "code": 6001,
      "name": "TreasuryOutOfAsh",
      "msg": "Treasury out of $ASH"
    },
    {
      "code": 6002,
      "name": "WrongMasterAccount",
      "msg": "Wrong master account"
    },
    {
      "code": 6003,
      "name": "WrongBankAccount",
      "msg": "Wrong bank account"
    },
    {
      "code": 6004,
      "name": "DailyBurnConsumed",
      "msg": "Burn rate limit exceeded"
    },
    {
      "code": 6005,
      "name": "NumericalOverflowError",
      "msg": "Numerical overflow error!"
    },
    {
      "code": 6006,
      "name": "InvalidMetadataKey",
      "msg": "Metadata's key does not match"
    },
    {
      "code": 6007,
      "name": "MintMismatch",
      "msg": "Mint given does not match mint on Metadata"
    },
    {
      "code": 6008,
      "name": "IncorrectOwner",
      "msg": "Incorrect account owner"
    },
    {
      "code": 6009,
      "name": "IncorrectTokenQuantity",
      "msg": "Incorrect token quantity"
    },
    {
      "code": 6010,
      "name": "IncorrectCreator",
      "msg": "Incorrect creator"
    },
    {
      "code": 6011,
      "name": "IncorrectPlotSize",
      "msg": "Incorrect plot size"
    },
    {
      "code": 6012,
      "name": "PlotSizeMismatch",
      "msg": "Plot size mismatch"
    },
    {
      "code": 6013,
      "name": "NotABooster",
      "msg": "Not a booster"
    },
    {
      "code": 6014,
      "name": "AshTokenOwnerNotMatchingPlotOwner",
      "msg": "Ash token owner not matching plot owner"
    },
    {
      "code": 6015,
      "name": "UserNotVoxelOwner",
      "msg": "User is not the voxel owner"
    },
    {
      "code": 6016,
      "name": "VoxelNftNotOwnedByUser",
      "msg": "Voxel NFT is not owned by user"
    },
    {
      "code": 6017,
      "name": "BurnedNftNotOwnedByUser",
      "msg": "Burned NFT is not owned by user"
    },
    {
      "code": 6018,
      "name": "BoosterNftNotOwnedByUser",
      "msg": "Booster NFT is not owned by user"
    },
    {
      "code": 6019,
      "name": "NotSplToken",
      "msg": "Not a spl-token"
    },
    {
      "code": 6020,
      "name": "NotMetaplexMetadata",
      "msg": "Not a metaplex metadata"
    },
    {
      "code": 6021,
      "name": "NotMincAccount",
      "msg": "Not Mortuary-inc data"
    },
    {
      "code": 6022,
      "name": "TaxAccountNotProvided",
      "msg": "Tax account not provided"
    },
    {
      "code": 6023,
      "name": "PlotSharingNotEnable",
      "msg": "Plot sharing is not enable"
    },
    {
      "code": 6024,
      "name": "NotMetaplexEdition",
      "msg": "Not a metaplex edition"
    },
    {
      "code": 6025,
      "name": "InvalidEditionKey",
      "msg": "Edition's key does not match"
    },
    {
      "code": 6026,
      "name": "InvalidEditionMaxSupply",
      "msg": "Invalid edition max supply"
    },
    {
      "code": 6027,
      "name": "MasterEditionIsNotTheMintAuthority",
      "msg": "Master edition is not the mint authority"
    },
    {
      "code": 6028,
      "name": "MasterEditionInvalid",
      "msg": "Master edition invalid"
    },
    {
      "code": 6029,
      "name": "NotRentExempt",
      "msg": "Not Rent Exempt"
    },
    {
      "code": 6030,
      "name": "CollectionAccountNotProvided",
      "msg": "Collection account not provided"
    },
    {
      "code": 6031,
      "name": "InvalidTaxAmount",
      "msg": "Tax amount invalid"
    },
    {
      "code": 6032,
      "name": "BurnNotOpen",
      "msg": "Burn not open"
    },
    {
      "code": 6033,
      "name": "BurnClose",
      "msg": "Burn close"
    },
    {
      "code": 6034,
      "name": "VoxelNftNotOwnedByCollector",
      "msg": "Voxel NFT is not owned by collector"
    }
  ]
};
