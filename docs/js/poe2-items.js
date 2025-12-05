/**
 * PoE2 Items Database - Validated unique items that exist in Path of Exile 2
 * This module provides the source of truth for item data
 * Sources: poe2db.tw, poe.ninja/poe2, game8.co, official PoE2 content
 */

const PoE2Items = {
    // Validated unique items organized by slot/type
    UNIQUES: {
        // === WEAPONS ===
        wand: [
            { name: "Lifesprig", type: "Wand", description: "+1 to Level of Spell Skills, Spell Damage, Life Regen" },
            { name: "Adonia's Ego", type: "Wand", description: "Spell damage and mana bonuses" },
            { name: "Enezun's Charge", type: "Wand", description: "Lightning spell focused" },
            { name: "Sanguine Diviner", type: "Wand", description: "Life and spell synergy" }
        ],
        sceptre: [
            { name: "Font of Power", type: "Sceptre", description: "Elemental damage bonuses" },
            { name: "Palm of the Dreamer", type: "Sceptre", description: "Spirit and aura focused" },
            { name: "Sacred Flame", type: "Sceptre", description: "Fire damage focused" }
        ],
        staff: [
            { name: "Dusk Vigil", type: "Staff", description: "Defensive spell casting" },
            { name: "Earthbound", type: "Staff", description: "Physical spell damage" },
            { name: "Taryn's Shiver", type: "Staff", description: "Cold spell damage, freezing" },
            { name: "The Searing Touch", type: "Staff", description: "Fire spell damage, burning" },
            { name: "Whispering Ice", type: "Staff", description: "Cold damage based on Intelligence" },
            { name: "The Unborn Lich", type: "Ravenous Staff", description: "Minion and necromancy focused" }
        ],
        bow: [
            { name: "Widowhail", type: "Bow", description: "Increased projectile damage" },
            { name: "Quill Rain", type: "Bow", description: "Extremely fast attack speed, reduced damage" },
            { name: "Doomfletch", type: "Bow", description: "Adds elemental damage based on physical" },
            { name: "Slivertongue", type: "Bow", description: "Fork and chain mechanics" }
        ],
        crossbow: [
            { name: "Mist Whisper", type: "Crossbow", description: "Evasion and projectile bonuses" },
            { name: "Rampart Raptor", type: "Crossbow", description: "Defensive mechanics" },
            { name: "The Last Lament", type: "Crossbow", description: "Critical strike focused" },
            { name: "Double Vision", type: "Dyad Crossbow", description: "Additional projectiles" },
            { name: "Fairgraves' Curse", type: "Artillery Bow", description: "Lightning and curse synergy" }
        ],
        quarterstaff: [
            { name: "Matsya", type: "Quarterstaff", description: "Monk attack skills" },
            { name: "Nazir's Judgement", type: "Quarterstaff", description: "Physical damage and stun" },
            { name: "Pillar of the Caged God", type: "Quarterstaff", description: "Scales with Strength" },
            { name: "Blood Thorn", type: "Quarterstaff", description: "Life leech and physical damage" }
        ],
        mace: [
            { name: "Frostbreath", type: "Mace", description: "Cold damage, double damage to chilled" },
            { name: "Seeing Stars", type: "Mace", description: "Stun and area damage" },
            { name: "Wylund's Stake", type: "Mace", description: "Fire damage and ignite" },
            { name: "Olrovasara", type: "Mace", description: "Unique attack mechanics" }
        ],
        greatmace: [
            { name: "Brain Rattler", type: "Great Mace", description: "Lightning damage and shock" },
            { name: "Chober Chaber", type: "Great Mace", description: "Minion damage bonuses" },
            { name: "Hrimnor's Hymn", type: "Great Mace", description: "Cold damage and freeze" },
            { name: "Quecholli", type: "Great Mace", description: "Culling strike mechanics" },
            { name: "Trephina", type: "Great Mace", description: "Critical strike focused" },
            { name: "Marohi Erqi", type: "Totemic Greatclub", description: "Increased area, reduced attack speed" }
        ],
        spear: [
            { name: "Saitha's Spear", type: "Spear", description: "Attack speed and reach" },
            { name: "Chainsting", type: "Spear", description: "Chain mechanics on hit" },
            { name: "Daevata's Wind", type: "Spear", description: "Evasion and attack speed" },
            { name: "Tyranny's Grip", type: "Spear", description: "Physical damage and intimidate" }
        ],
        dagger: [
            { name: "Winter's Bite", type: "Dagger", description: "Cold damage and chill" }
        ],

        // === ARMOR ===
        body: [
            { name: "Ghostwrithe", type: "Body Armour", description: "Energy Shield, Chaos resistance" },
            { name: "Enfolding Dawn", type: "Body Armour", description: "+100 Spirit, Elemental Resistances" },
            { name: "Bitterbloom", type: "Body Armour", description: "Cold damage and defense" },
            { name: "Lightning Coil", type: "Ancestral Mail", description: "Physical damage taken as Lightning" },
            { name: "Cospri's Will", type: "Assassin Garb", description: "Poison and curse synergy" },
            { name: "Hyrri's Ire", type: "Body Armour", description: "Cold damage, evasion if not hit recently" },
            { name: "Gloamgown", type: "Body Armour", description: "1000% increased ES recharge rate" },
            { name: "Sacrosanctum", type: "Body Armour", description: "Life recoup affects Energy Shield" },
            { name: "Tabula Rasa", type: "Simple Robe", description: "6 white sockets, no stats" }
        ],
        helmet: [
            { name: "Goldrim", type: "Leather Cap", description: "All Elemental Resistances" },
            { name: "Thrillsteel", type: "Helmet", description: "Movement speed and damage" },
            { name: "Greymake", type: "Helmet", description: "Defensive bonuses" },
            { name: "Demigod's Virtue", type: "Helmet", description: "Rare event reward item" }
        ],
        gloves: [
            { name: "Thunderfist", type: "Utility Wraps", description: "Lightning damage to attacks" }
        ],
        boots: [
            { name: "Wanderlust", type: "Wrapped Sandals", description: "Movement speed, freeze immunity" },
            { name: "Bushwhack", type: "Boots", description: "Movement and evasion" },
            { name: "Luminous Pace", type: "Boots", description: "Energy Shield and speed" },
            { name: "Shankgonne", type: "Covered Sabatons", description: "Unique attack from boots" }
        ],
        shield: [
            { name: "Kaltenhalt", type: "Ridged Buckler", description: "Cold damage and freeze chance" },
            { name: "Calgyra's Arc", type: "Buckler", description: "Parry mechanics" }
        ],
        quiver: [
            { name: "Asphyxia's Wrath", type: "Quiver", description: "Chaos damage and poison" },
            { name: "Blackgleam", type: "Quiver", description: "Fire damage conversion" }
        ],

        // === ACCESSORIES ===
        belt: [
            { name: "Darkness Enthroned", type: "Stygian Vise", description: "Increased effect of socketed jewels" },
            { name: "Headhunter", type: "Heavy Belt", description: "Steal rare monster mods on kill" },
            { name: "Umbilicus Immortalis", type: "Linen Belt", description: "Flask effects apply to minions" }
        ],
        ring: [
            { name: "Thief's Torment", type: "Ring", description: "Life/Mana gain on hit, item rarity" },
            { name: "Dream Fragments", type: "Ring", description: "Freeze/Chill immunity, mana" },
            { name: "Grip of Kulemak", type: "Abyssal Signet", description: "Unique ring mechanics" }
        ],
        amulet: [
            { name: "Hinekora's Sight", type: "Stellar Amulet", description: "Accuracy and evasion synergy" },
            { name: "Revered Resin", type: "Amulet", description: "Defensive bonuses" }
        ],
        jewel: [
            { name: "Heart of the Well", type: "Diamond Jewel", description: "Skill effect duration" },
            { name: "Undying Hate", type: "Jewel", description: "Minion damage, variant-based effects" }
        ],
        charm: [
            { name: "Beira's Anguish", type: "Charm", description: "Ignite immunity" }
        ],

        // === FLASKS ===
        flask: [
            { name: "Blood of the Warrior", type: "Gargantuan Life Flask", description: "Unique life recovery" }
        ]
    },

    /**
     * Check if an item name is a valid PoE2 unique
     */
    isValidUnique(itemName) {
        const normalizedName = itemName.toLowerCase().trim();

        for (const category of Object.values(this.UNIQUES)) {
            for (const item of category) {
                if (item.name.toLowerCase() === normalizedName) {
                    return true;
                }
            }
        }
        return false;
    },

    /**
     * Get item data by name
     */
    getItem(itemName) {
        const normalizedName = itemName.toLowerCase().trim();

        for (const [slot, items] of Object.entries(this.UNIQUES)) {
            for (const item of items) {
                if (item.name.toLowerCase() === normalizedName) {
                    return { ...item, slot };
                }
            }
        }
        return null;
    },

    /**
     * Get all items for a slot
     */
    getItemsForSlot(slot) {
        const slotMapping = {
            weapon: ['wand', 'sceptre', 'staff', 'bow', 'crossbow', 'quarterstaff', 'mace', 'greatmace', 'spear', 'dagger'],
            offhand: ['shield', 'quiver'],
            body: ['body'],
            helmet: ['helmet'],
            gloves: ['gloves'],
            boots: ['boots'],
            belt: ['belt'],
            ring1: ['ring'],
            ring2: ['ring'],
            amulet: ['amulet'],
            jewel1: ['jewel'],
            jewel2: ['jewel'],
            jewel3: ['jewel'],
            flask: ['flask']
        };

        const categories = slotMapping[slot] || [slot];
        const items = [];

        for (const category of categories) {
            if (this.UNIQUES[category]) {
                items.push(...this.UNIQUES[category]);
            }
        }

        return items;
    },

    /**
     * Validate an entire build's items
     * Returns { valid: [], invalid: [] }
     */
    validateBuildItems(items) {
        const result = { valid: [], invalid: [] };

        for (const item of items) {
            if (!item.is_unique) {
                result.valid.push(item);
            } else if (this.isValidUnique(item.item_name)) {
                result.valid.push(item);
            } else {
                result.invalid.push(item);
            }
        }

        return result;
    },

    /**
     * Suggest a replacement for an invalid item
     */
    suggestReplacement(slot, buildType) {
        const items = this.getItemsForSlot(slot);
        if (items.length > 0) {
            // Return the first available item for that slot
            return items[0];
        }
        return null;
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PoE2Items;
}
