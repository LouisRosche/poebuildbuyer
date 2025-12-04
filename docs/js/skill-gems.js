/**
 * Skill Gems module - Gem data and recommendations for builds
 * Provides skill gem information, links, and socket configurations
 */

const SkillGems = {
    // Gem categories
    CATEGORIES: {
        main: 'Main Skill',
        support: 'Support',
        aura: 'Aura',
        movement: 'Movement',
        utility: 'Utility',
        guard: 'Guard',
        curse: 'Curse',
        totem: 'Totem/Brand',
        minion: 'Minion'
    },

    // Common gem data with PoE2 gems
    GEMS: {
        // Attack Skills
        'lightning_arrow': {
            name: 'Lightning Arrow',
            category: 'main',
            tags: ['attack', 'bow', 'lightning', 'aoe'],
            description: 'Fires an arrow that deals lightning damage and chains to nearby enemies.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Lightning_Arrow'
        },
        'ice_shot': {
            name: 'Ice Shot',
            category: 'main',
            tags: ['attack', 'bow', 'cold', 'aoe'],
            description: 'Fires an arrow that converts physical damage to cold and creates ground ice.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Ice_Shot'
        },
        'power_siphon': {
            name: 'Power Siphon',
            category: 'main',
            tags: ['attack', 'wand', 'projectile'],
            description: 'Fires wand projectiles that grant power charges on kill.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Power_Siphon'
        },
        'heavy_strike': {
            name: 'Heavy Strike',
            category: 'main',
            tags: ['attack', 'melee', 'strike', 'physical'],
            description: 'Powerful single-target melee attack with high damage.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Heavy_Strike'
        },
        'cleave': {
            name: 'Cleave',
            category: 'main',
            tags: ['attack', 'melee', 'aoe', 'physical'],
            description: 'Swings weapon in an arc, hitting multiple enemies.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Cleave'
        },
        'ground_slam': {
            name: 'Ground Slam',
            category: 'main',
            tags: ['attack', 'melee', 'slam', 'aoe', 'physical'],
            description: 'Slams the ground, sending out a wave of damage.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Ground_Slam'
        },
        'cyclone': {
            name: 'Cyclone',
            category: 'main',
            tags: ['attack', 'melee', 'channelling', 'aoe', 'movement'],
            description: 'Spin through enemies while dealing damage.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Cyclone'
        },

        // Spell Skills
        'fireball': {
            name: 'Fireball',
            category: 'main',
            tags: ['spell', 'projectile', 'fire', 'aoe'],
            description: 'Launches a ball of fire that explodes on impact.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Fireball'
        },
        'rolling_magma': {
            name: 'Rolling Magma',
            category: 'main',
            tags: ['spell', 'projectile', 'fire', 'aoe'],
            description: 'Launches a bouncing ball of magma.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Rolling_Magma'
        },
        'flame_wall': {
            name: 'Flame Wall',
            category: 'main',
            tags: ['spell', 'fire', 'aoe', 'duration'],
            description: 'Creates a wall of fire that damages enemies passing through.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Flame_Wall'
        },
        'ice_nova': {
            name: 'Ice Nova',
            category: 'main',
            tags: ['spell', 'cold', 'aoe'],
            description: 'Releases a nova of cold damage around you.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Ice_Nova'
        },
        'freezing_pulse': {
            name: 'Freezing Pulse',
            category: 'main',
            tags: ['spell', 'projectile', 'cold'],
            description: 'Fires a wave of cold that damages and chills enemies.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Freezing_Pulse'
        },
        'arc': {
            name: 'Arc',
            category: 'main',
            tags: ['spell', 'lightning', 'chaining'],
            description: 'Lightning that chains between enemies.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Arc'
        },
        'spark': {
            name: 'Spark',
            category: 'main',
            tags: ['spell', 'projectile', 'lightning', 'duration'],
            description: 'Releases multiple lightning projectiles that move erratically.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Spark'
        },
        'essence_drain': {
            name: 'Essence Drain',
            category: 'main',
            tags: ['spell', 'projectile', 'chaos', 'dot', 'duration'],
            description: 'Fires a projectile that applies chaos damage over time.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Essence_Drain'
        },
        'contagion': {
            name: 'Contagion',
            category: 'main',
            tags: ['spell', 'chaos', 'aoe', 'duration'],
            description: 'Applies a spreading chaos debuff to enemies.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Contagion'
        },
        'blight': {
            name: 'Blight',
            category: 'main',
            tags: ['spell', 'chaos', 'channelling', 'aoe', 'dot'],
            description: 'Channel chaos damage in a cone, hindering enemies.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Blight'
        },

        // Minion Skills
        'raise_zombie': {
            name: 'Raise Zombie',
            category: 'minion',
            tags: ['spell', 'minion'],
            description: 'Raises a zombie from a corpse to fight for you.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Raise_Zombie'
        },
        'summon_skeleton': {
            name: 'Summon Skeleton',
            category: 'minion',
            tags: ['spell', 'minion'],
            description: 'Summons skeleton warriors to fight for you.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Summon_Skeleton'
        },
        'raise_spectre': {
            name: 'Raise Spectre',
            category: 'minion',
            tags: ['spell', 'minion'],
            description: 'Raises a monster as a permanent spectre minion.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Raise_Spectre'
        },
        'summon_raging_spirit': {
            name: 'Summon Raging Spirit',
            category: 'minion',
            tags: ['spell', 'minion', 'fire', 'duration'],
            description: 'Summons flaming skulls that swarm enemies.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Summon_Raging_Spirit'
        },

        // Auras
        'hatred': {
            name: 'Hatred',
            category: 'aura',
            tags: ['aura', 'cold'],
            description: 'Aura that adds cold damage based on physical damage.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Hatred'
        },
        'wrath': {
            name: 'Wrath',
            category: 'aura',
            tags: ['aura', 'lightning'],
            description: 'Aura that adds lightning damage to attacks and spells.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Wrath'
        },
        'anger': {
            name: 'Anger',
            category: 'aura',
            tags: ['aura', 'fire'],
            description: 'Aura that adds fire damage to attacks and spells.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Anger'
        },
        'determination': {
            name: 'Determination',
            category: 'aura',
            tags: ['aura', 'defence'],
            description: 'Aura that grants more armour.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Determination'
        },
        'grace': {
            name: 'Grace',
            category: 'aura',
            tags: ['aura', 'defence'],
            description: 'Aura that grants more evasion.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Grace'
        },
        'discipline': {
            name: 'Discipline',
            category: 'aura',
            tags: ['aura', 'defence'],
            description: 'Aura that grants additional energy shield.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Discipline'
        },
        'clarity': {
            name: 'Clarity',
            category: 'aura',
            tags: ['aura', 'mana'],
            description: 'Aura that grants mana regeneration.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Clarity'
        },
        'pride': {
            name: 'Pride',
            category: 'aura',
            tags: ['aura', 'physical'],
            description: 'Aura that causes nearby enemies to take more physical damage.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Pride'
        },
        'malevolence': {
            name: 'Malevolence',
            category: 'aura',
            tags: ['aura', 'dot'],
            description: 'Aura that increases damage over time and skill effect duration.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Malevolence'
        },
        'zealotry': {
            name: 'Zealotry',
            category: 'aura',
            tags: ['aura', 'spell', 'crit'],
            description: 'Aura that grants spell damage and critical strike chance.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Zealotry'
        },

        // Movement
        'flame_dash': {
            name: 'Flame Dash',
            category: 'movement',
            tags: ['spell', 'movement', 'fire'],
            description: 'Teleport to a location, leaving fire in your wake.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Flame_Dash'
        },
        'dash': {
            name: 'Dash',
            category: 'movement',
            tags: ['movement'],
            description: 'Perform a quick dash to a target location.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Dash'
        },
        'leap_slam': {
            name: 'Leap Slam',
            category: 'movement',
            tags: ['attack', 'melee', 'movement', 'aoe'],
            description: 'Jump to a location, damaging enemies on landing.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Leap_Slam'
        },
        'whirling_blades': {
            name: 'Whirling Blades',
            category: 'movement',
            tags: ['attack', 'melee', 'movement'],
            description: 'Dash forward while slashing with your weapon.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Whirling_Blades'
        },
        'frostblink': {
            name: 'Frostblink',
            category: 'movement',
            tags: ['spell', 'movement', 'cold'],
            description: 'Instantly teleport, chilling enemies at both locations.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Frostblink'
        },

        // Guard Skills
        'molten_shell': {
            name: 'Molten Shell',
            category: 'guard',
            tags: ['spell', 'guard', 'fire'],
            description: 'Grants a shield based on your armour.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Molten_Shell'
        },
        'steelskin': {
            name: 'Steelskin',
            category: 'guard',
            tags: ['spell', 'guard'],
            description: 'Grants a flat damage shield.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Steelskin'
        },
        'immortal_call': {
            name: 'Immortal Call',
            category: 'guard',
            tags: ['spell', 'guard', 'duration'],
            description: 'Briefly makes you invulnerable to physical and elemental damage.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Immortal_Call'
        },

        // Utility
        'blood_rage': {
            name: 'Blood Rage',
            category: 'utility',
            tags: ['spell', 'duration'],
            description: 'Grants attack speed and life leech, drains life over time.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Blood_Rage'
        },
        'arcane_surge': {
            name: 'Arcane Surge',
            category: 'utility',
            tags: ['spell', 'duration'],
            description: 'Grants increased spell damage and mana regeneration.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Arcane_Surge'
        },
        'convocation': {
            name: 'Convocation',
            category: 'utility',
            tags: ['spell', 'minion'],
            description: 'Recalls your minions and grants them life regeneration.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Convocation'
        },
        'offering': {
            name: 'Flesh Offering',
            category: 'utility',
            tags: ['spell', 'minion'],
            description: 'Consumes corpses to grant minions attack and cast speed.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Flesh_Offering'
        },

        // Curses
        'flammability': {
            name: 'Flammability',
            category: 'curse',
            tags: ['spell', 'curse', 'fire'],
            description: 'Curses enemies to take increased fire damage.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Flammability'
        },
        'frostbite': {
            name: 'Frostbite',
            category: 'curse',
            tags: ['spell', 'curse', 'cold'],
            description: 'Curses enemies to take increased cold damage.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Frostbite'
        },
        'conductivity': {
            name: 'Conductivity',
            category: 'curse',
            tags: ['spell', 'curse', 'lightning'],
            description: 'Curses enemies to take increased lightning damage.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Conductivity'
        },
        'despair': {
            name: 'Despair',
            category: 'curse',
            tags: ['spell', 'curse', 'chaos'],
            description: 'Curses enemies to take increased chaos damage.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Despair'
        },
        'vulnerability': {
            name: 'Vulnerability',
            category: 'curse',
            tags: ['spell', 'curse', 'physical'],
            description: 'Curses enemies to take increased physical damage.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Vulnerability'
        },
        'temporal_chains': {
            name: 'Temporal Chains',
            category: 'curse',
            tags: ['spell', 'curse'],
            description: 'Curses enemies to act slower.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Temporal_Chains'
        },
        'enfeeble': {
            name: 'Enfeeble',
            category: 'curse',
            tags: ['spell', 'curse'],
            description: 'Curses enemies to deal less damage.',
            wiki_url: 'https://www.poe2wiki.net/wiki/Enfeeble'
        }
    },

    // Build-specific gem setups
    BUILD_GEMS: {
        'blackflame-blood-mage': {
            main_skill: {
                name: 'Flame Wall + Fire Trap',
                gems: ['flame_wall', 'fireball'],
                description: 'Use Flame Wall as your main DoT, with Fireball for ignite application. Blackflame converts ignite to chaos.',
                links: ['Greater Multiple Projectiles', 'Combustion', 'Burning Damage', 'Deadly Ailments']
            },
            auras: ['malevolence', 'determination'],
            movement: 'flame_dash',
            guard: 'molten_shell',
            curse: 'despair',
            utility: ['blood_rage']
        },
        'summon-army-necromancer': {
            main_skill: {
                name: 'Zombie + Spectre Army',
                gems: ['raise_zombie', 'raise_spectre', 'summon_skeleton'],
                description: 'Raise a massive army of zombies, spectres, and skeletons. Use Convocation to control minion positioning.',
                links: ['Minion Damage', 'Multistrike', 'Melee Physical Damage', 'Feeding Frenzy']
            },
            auras: ['determination', 'discipline'],
            movement: 'flame_dash',
            guard: 'steelskin',
            curse: 'vulnerability',
            utility: ['convocation', 'offering']
        },
        'lightning-strike-slayer': {
            main_skill: {
                name: 'Lightning Strike',
                gems: ['lightning_arrow'],  // placeholder - actual skill
                description: 'Melee attack that also fires lightning projectiles. Excellent for clearing and single target.',
                links: ['Elemental Damage with Attacks', 'Added Lightning Damage', 'Multistrike', 'Lightning Penetration']
            },
            auras: ['wrath', 'grace'],
            movement: 'whirling_blades',
            guard: 'molten_shell',
            curse: 'conductivity',
            utility: ['blood_rage']
        },
        'ice-shot-deadeye': {
            main_skill: {
                name: 'Ice Shot',
                gems: ['ice_shot'],
                description: 'Fires arrows that convert physical to cold damage, leaving chilled ground.',
                links: ['Greater Multiple Projectiles', 'Added Cold Damage', 'Hypothermia', 'Cold Penetration']
            },
            auras: ['hatred', 'grace'],
            movement: 'dash',
            guard: 'steelskin',
            curse: 'frostbite',
            utility: ['blood_rage']
        },
        'arc-elementalist': {
            main_skill: {
                name: 'Arc',
                gems: ['arc'],
                description: 'Chain lightning that jumps between enemies. Excellent clear speed with inherent chaining.',
                links: ['Spell Echo', 'Added Lightning Damage', 'Lightning Penetration', 'Controlled Destruction']
            },
            auras: ['wrath', 'zealotry'],
            movement: 'flame_dash',
            guard: 'steelskin',
            curse: 'conductivity',
            utility: ['arcane_surge']
        },
        'essence-drain-occultist': {
            main_skill: {
                name: 'Essence Drain + Contagion',
                gems: ['essence_drain', 'contagion'],
                description: 'Apply ED to a target, then spread with Contagion for massive AoE clear.',
                links: ['Controlled Destruction', 'Efficacy', 'Void Manipulation', 'Swift Affliction']
            },
            auras: ['malevolence', 'discipline'],
            movement: 'flame_dash',
            guard: 'steelskin',
            curse: 'despair',
            utility: ['arcane_surge']
        },
        'cyclone-slayer': {
            main_skill: {
                name: 'Cyclone',
                gems: ['cyclone'],
                description: 'Spin to win! Channel through enemies dealing physical damage.',
                links: ['Melee Physical Damage', 'Impale', 'Fortify', 'Infused Channelling']
            },
            auras: ['pride', 'determination'],
            movement: 'leap_slam',
            guard: 'molten_shell',
            curse: 'vulnerability',
            utility: ['blood_rage']
        },
        'spark-inquisitor': {
            main_skill: {
                name: 'Spark',
                gems: ['spark'],
                description: 'Release lightning projectiles that bounce around dealing damage.',
                links: ['Spell Echo', 'Added Lightning Damage', 'Pierce', 'Lightning Penetration']
            },
            auras: ['wrath', 'zealotry'],
            movement: 'flame_dash',
            guard: 'steelskin',
            curse: 'conductivity',
            utility: ['arcane_surge']
        }
    },

    /**
     * Get gem data by ID
     */
    getGem(gemId) {
        return this.GEMS[gemId] || null;
    },

    /**
     * Get gem setup for a build
     */
    getBuildGems(archetypeId) {
        return this.BUILD_GEMS[archetypeId] || null;
    },

    /**
     * Generate gem setup HTML for a build
     */
    renderBuildGems(archetypeId) {
        const setup = this.getBuildGems(archetypeId);
        if (!setup) {
            return '<p class="text-muted">Gem setup coming soon...</p>';
        }

        const mainGem = setup.main_skill;
        const auras = (setup.auras || []).map(id => this.GEMS[id]).filter(Boolean);
        const movement = this.GEMS[setup.movement];
        const guard = this.GEMS[setup.guard];
        const curse = this.GEMS[setup.curse];
        const utility = (setup.utility || []).map(id => this.GEMS[id]).filter(Boolean);

        return `
            <div class="gem-setup">
                <div class="gem-section main-skill">
                    <h4 class="gem-section-title">Main Skill</h4>
                    <div class="gem-name">${mainGem.name}</div>
                    <p class="gem-description">${mainGem.description}</p>
                    <div class="gem-links">
                        <span class="links-label">Recommended Links:</span>
                        ${mainGem.links.map(link => `<span class="gem-link">${link}</span>`).join(' + ')}
                    </div>
                </div>

                <div class="gem-section auras">
                    <h4 class="gem-section-title">Auras</h4>
                    <div class="gem-list">
                        ${auras.map(gem => `
                            <a href="${gem.wiki_url}" target="_blank" class="gem-badge aura"
                               data-gem-tooltip="${gem.name}">
                                ${gem.name}
                            </a>
                        `).join('')}
                    </div>
                </div>

                <div class="gem-row">
                    ${movement ? `
                        <div class="gem-section movement">
                            <h4 class="gem-section-title">Movement</h4>
                            <a href="${movement.wiki_url}" target="_blank" class="gem-badge movement"
                               data-gem-tooltip="${movement.name}">
                                ${movement.name}
                            </a>
                        </div>
                    ` : ''}

                    ${guard ? `
                        <div class="gem-section guard">
                            <h4 class="gem-section-title">Guard</h4>
                            <a href="${guard.wiki_url}" target="_blank" class="gem-badge guard"
                               data-gem-tooltip="${guard.name}">
                                ${guard.name}
                            </a>
                        </div>
                    ` : ''}

                    ${curse ? `
                        <div class="gem-section curse">
                            <h4 class="gem-section-title">Curse</h4>
                            <a href="${this.GEMS[setup.curse]?.wiki_url || '#'}" target="_blank"
                               class="gem-badge curse" data-gem-tooltip="${curse.name}">
                                ${curse.name}
                            </a>
                        </div>
                    ` : ''}
                </div>

                ${utility.length > 0 ? `
                    <div class="gem-section utility">
                        <h4 class="gem-section-title">Utility</h4>
                        <div class="gem-list">
                            ${utility.map(gem => `
                                <a href="${gem.wiki_url}" target="_blank" class="gem-badge utility"
                                   data-gem-tooltip="${gem.name}">
                                    ${gem.name}
                                </a>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    },

    /**
     * Get a default gem setup based on archetype properties
     */
    generateDefaultSetup(archetype) {
        const setup = {
            main_skill: { name: 'Main Skill', gems: [], description: '', links: [] },
            auras: [],
            movement: 'flame_dash',
            guard: 'steelskin',
            curse: null,
            utility: []
        };

        // Determine main damage type for curse
        const damageType = archetype.damage_type || 'physical';
        const curseMap = {
            fire: 'flammability',
            cold: 'frostbite',
            lightning: 'conductivity',
            chaos: 'despair',
            physical: 'vulnerability'
        };
        setup.curse = curseMap[damageType] || 'vulnerability';

        // Determine auras based on damage type
        const auraMap = {
            fire: ['anger', 'determination'],
            cold: ['hatred', 'grace'],
            lightning: ['wrath', 'zealotry'],
            chaos: ['malevolence', 'discipline'],
            physical: ['pride', 'determination']
        };
        setup.auras = auraMap[damageType] || ['determination', 'grace'];

        // Movement based on playstyle
        if (archetype.primary_playstyle === 'melee') {
            setup.movement = 'leap_slam';
            setup.guard = 'molten_shell';
        }

        return setup;
    }
};

// Initialize
console.log('SkillGems: Module loaded');
