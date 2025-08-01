<template>
  <div>
    <!-- composants dynamiques -->
    <div v-if="localComposants.length">
      <v-card v-for="(composant, index) in localComposants" :key="`composant-${index}`" color="grey-lighten-3 lighten-10" class="pa-2 mb-3" outlined>
        <v-card-title class="text-h6 d-flex align-center pa-0">
          <span>Composant {{ index + 1 }}</span>
          <v-spacer/>
          <v-btn size="small" icon color="error" @click="removeComposant(index)" title="Supprimer">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </v-card-title>
        <v-row dense>
          <v-col cols="12" md="4">
            <v-select density="compact" v-model="composant.type" :items="composantTypes" label="Composant Tiers" :rules="requiredRules" dense hide-details="auto" rounded outlined/>
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field v-model="composant.nomComposant" density="compact" label="Nom composant (Optionnel)" persistent-hint :rules="optionalMajusculeRules" dense hide-details="auto" rounded variant="outlined"/>
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field v-model="composant.nomNetworkGroupVRA" label="Nom Network Group VRA" persistent-hint disabled dense hide-details="auto" density="compact" bg-color="orange" variant="outlined" rounded/>
          </v-col>
        </v-row>

        <!-- Tiers dynamiques -->
        <div v-if="composant.tiers.length">
          <v-card v-for="(tier, tierIndex) in composant.tiers" :key="`tier-${index}-${tierIndex}`" class="pa-2 mb-2 mt-2" color="grey lighten-4" outlined>
            <div class="d-flex align-center mb-1">
              <span class="subtitle-2 font-weight-medium">Tier {{ tierIndex + 1 }}</span>
              <v-spacer/>
              <v-btn size="x-small" icon color="error" @click="removeTier(index, tierIndex)" title="Supprimer le tier">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </div>
           
            <v-row dense>
              <v-col cols="12" md="3">
                <v-select
                  v-model="tier.type"
                  :items="typeTiers"
                  label="Type de tier *"
                  :rules="requiredRules"
                  density="compact"
                  dense
                  hide-details="auto"
                  outlined
                />
              </v-col>

              <v-col cols="12" md="3">
                <v-select
                  v-model="tier.zoneSecurite"
                  :items="zonesSecurite"
                  label="Zone de Sécurité *"
                  :rules="requiredRules"
                  density="compact"
                  dense
                  hide-details="auto"
                  outlined
                />
              </v-col>

              <v-col cols="12" md="1"></v-col>

              <v-col cols="12" md="5" class="d-flex align-center">
                <span class="mr-3 font-weight-medium">Option VIP <span class="red--text">*</span></span>
                <v-radio-group
                  v-model="tier.optionVIP"
                  row
                  :rules="requiredRules"
                  hide-details="auto"
                  density="compact"
                  inline
                >
                  <v-radio label="Pas de VIP" value="Pas de VIP" />
                  <v-radio label="VIP F5" value="VIP F5" />
                </v-radio-group>
              </v-col>
            </v-row>

            <!-- Groupes réseau -->
            <v-row dense>
              <template v-if="tier.groups.groupServeurs">
                <v-col cols="12" md="3" class="text-left font-weight-medium">Groupe Serveurs :</v-col>
                <v-col cols="12" md="9">
                  <v-chip density="compact" color="primary" variant="outlined">{{ tier.groups.groupServeurs }}</v-chip>
                </v-col>
              </template>
              <template v-if="tier.groups.groupVIP">
                <v-col cols="12" md="3" class="text-left font-weight-medium">Groupe VIP PRIV :</v-col>
                <v-col cols="12" md="9">
                  <v-chip density="compact" color="primary" variant="outlined">{{ tier.groups.groupVIP }}</v-chip>
                </v-col>
              </template>
              <template v-if="tier.groups.groupSNAT">
                <v-col cols="12" md="3" class="text-left font-weight-medium">Groupe SNAT PRIV :</v-col>
                <v-col cols="12" md="9">
                  <v-chip density="compact" color="primary" variant="outlined">{{ tier.groups.groupSNAT }}</v-chip>
                </v-col>
              </template>
            </v-row>
          </v-card>
        </div>

        <!-- Bouton ajouter tier -->
        <v-btn color="secondary" text class="mt-1 mb-1" @click="addTier(index)">
          <v-icon left>mdi-plus</v-icon>
          Ajouter un tier
        </v-btn>
      </v-card>
    </div>

    <!-- Ajouter un composant -->
    <v-btn color="primary" text class="mt-1" @click="addComposant">
      <v-icon left>mdi-plus</v-icon>
      Ajouter un Composant
    </v-btn>


    <!-- Tableau affection de groups-->
    <v-card class="pa-2 mb-3 mt-3" outlined>
      <v-card-title class="text-h6">Affection de groupes AUTO</v-card-title>
      <v-table dense>
        <thead>
          <tr>
            <th scope="comso">Groupe consomation</th>
            <th scope="service">À Affecter au Groupe de "Service"</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(groupList, groupKey) in localAffectationGroupsAuto" :key="groupKey">
            <td>
              <v-chip
                v-for="group in groupList"
                :key="group"
                class="ma-1"
                color="primary"
                density="compact"
                variant="outlined"
              >
                {{ group }}
              </v-chip>
            </td>
            <td>
              <v-chip class="ma-1" color="secondary" density="compact" variant="outlined">
                {{ groupKey }}
              </v-chip>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
   
  </div>
</template>

<script>
export default {
  name: 'ComposantsSection',
  props: {
    modelValue: {
      type: Array,
      default: () => []
    },
    applicationData: {
      type: Object,
      default: () => ({})
    },
    affectationGroupsAuto: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:modelValue', 'update:affectationGroupsAuto'],
  data() {
    return {
      localComposants: [...this.modelValue],
      composantTypes: ['1-Tier', '2-Tier', '3-Tier'],
      typeTiers: ['Application', 'Présentation', 'Base de données', 'NAS'],
      zonesSecurite: ['STD', 'SEC-INT', 'SEC-EXT', 'TEC-INT', 'TEC-EXT', 'MGMT'],
      requiredRules: [v => !!v || 'Ce champ est obligatoire'],
      optionalMajusculeRules: [
        v => !v || (v.length <= 12 && /^[A-Z]*$/.test(v)) || 'Maximum 12 caractères majuscules sans espace'
      ],
      isUpdatingFromParent: false, // Flag pour éviter les boucles
      localAffectationGroupsAuto : {...this.affectationGroupsAuto},
      suffixAffectationVip: '-SEC-AUTO-VIPs-MEMBRES',
      suffixAffectationSnat: '-SEC-TEC-SNAT-ORCHESTRATION'
    };
  },
  watch: {
    modelValue: {
      handler(newVal) {
        if (JSON.stringify(this.localComposants) !== JSON.stringify(newVal)) {
          this.isUpdatingFromParent = true;
          this.localComposants = [...newVal];
          this.$nextTick(() => {
            this.isUpdatingFromParent = false;
          });
        }
      },
      deep: true
    },
    localComposants: {
      handler() {
        if (!this.isUpdatingFromParent) {
          this.emitUpdate();
        }
      },
      deep: true
    },
    applicationData: {
      handler(newVal, oldVal) {
        // Seulement si les données ont vraiment changé et qu'on n'est pas en train de mettre à jour depuis le parent
        if (!this.isUpdatingFromParent && newVal && JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
          this.updateAllNomNetworkGroupVRA();
          this.generateGroupNames();
          this.$emit('update:modelValue', [...this.localComposants]);
        }
      },
      deep: true
    },
    affectationGroupsAuto: {
      handler(newVal) {
        if (JSON.stringify(this.localAffectationGroupsAuto) !== JSON.stringify(newVal)) {
          this.localAffectationGroupsAuto = {...newVal};
        }
      },
      deep: true
    }
  },
  methods: {
    addComposant() {
      this.localComposants.push({
        type: '',
        nomComposant: '',
        nomNetworkGroupVRA: '',
        tiers: [
          {
            type: '',
            zoneSecurite: '',
            optionVIP: 'Pas de VIP',
            groups: {
              groupServeurs: '',
              groupVIP: '',
              groupSNAT: ''
            }
          }
        ]
      });
    },
   
    removeComposant(index) {
      this.localComposants.splice(index, 1);
    },
   
    addTier(index) {
      this.localComposants[index].tiers.push({
        type: '',
        zoneSecurite: '',
        optionVIP: 'Pas de VIP',
        groups: {
          groupServeurs: '',
          groupVIP: '',
          groupSNAT: ''
        }
      });
    },
   
    removeTier(bpIndex, tierIndex) {
      this.localComposants[bpIndex].tiers.splice(tierIndex, 1);
    },
   
    formatMajusculesSansEspaces(value) {
      return value ? value.replace(/\s+/g, '').toUpperCase() : '';
    },
   
    formatComposantNames() {
      this.localComposants.forEach(bp => {
        bp.nomComposant = this.formatMajusculesSansEspaces(bp.nomComposant);
      });
    },
   
    updateAllNomNetworkGroupVRA() {
      const nomCloud = this.applicationData.nomRessourceCloud || '';
      const nomSousApplication = this.applicationData.nomSousApplication || '';
     
      this.localComposants.forEach(bp => {
        const parts = [nomCloud, nomSousApplication, bp.nomComposant].filter(Boolean);
        bp.nomNetworkGroupVRA = parts.join('-');
      });
    },
   
    generateGroupNames() {
      const envCode = this.mapEnvironment(this.applicationData.environnement);
      const cloud = this.applicationData.nomRessourceCloud || '';
      const nomSousApplication = this.applicationData.nomSousApplication || '';

      const vipKey = this.getGroupAffectationVIP(envCode);
      const snatKey = this.getGroupAffectationSNAT(envCode);
       
      const newAffectationGroupsAuto = this.localComposants.length > 0 ?  { [vipKey]: [], [snatKey]: [] } : {};
      let nbtiers = 0;
      
      this.localComposants.forEach(({ type, nomComposant, tiers }) => {
        tiers.forEach(tier => {
          const { zoneSecurite: zone, type: tierType, optionVIP } = tier;
          const suffix = this.getTierSuffix(type, tierType);
          const groupBase = {
            env: envCode,
            zone,
            cloud,
            sousApp: nomSousApplication,
            composant: nomComposant,
            suffix,
            vipSnat: ''
          };

          // Serveurs
          tier.groups.groupServeurs = this.buildGroupName(groupBase);

          // VIP & SNAT
          if (optionVIP && optionVIP !== 'Pas de VIP') {
            nbtiers += 1;
            const vipZone = 'SEC-TEC';
            const baseVIP = { ...groupBase, zone: vipZone };
            tier.groups.groupVIP = this.buildGroupName({ ...baseVIP, vipSnat: 'VIP' });
            tier.groups.groupSNAT = this.buildGroupName({ ...baseVIP, vipSnat: 'SNAT' });

            newAffectationGroupsAuto[vipKey].push(tier.groups.groupServeurs);
            newAffectationGroupsAuto[snatKey].push(tier.groups.groupSNAT);
          } else {
            tier.groups.groupVIP = '';
            tier.groups.groupSNAT = '';
          }
        });
      });
      
      if (nbtiers == 0) {
        this.localAffectationGroupsAuto = {};
      } else {
        this.localAffectationGroupsAuto = newAffectationGroupsAuto;
      }
      
      // Émettre seulement si les données ont changé
      if (JSON.stringify(this.localAffectationGroupsAuto) !== JSON.stringify(this.affectationGroupsAuto)) {
        this.$emit('update:affectationGroupsAuto', this.localAffectationGroupsAuto);
      }
    },
   
    buildGroupName({ env, zone, cloud, sousApp, composant, suffix, vipSnat }) {
      return ['GR', env, zone, 'AUTO', cloud, sousApp, composant, suffix, vipSnat]
        .filter(Boolean)
        .join('-');
    },
   
    getTierSuffix(composantType, tierType) {
      if (composantType === '3-Tier' && tierType === 'Présentation') return 'FRONT';
      if (tierType === 'Base de données') return 'BDD';
      if (tierType === 'NAS') return 'NAS';
      return '';
    },
   
    mapEnvironment(env) {
      return {
        PRD: 'PRD',
        PPR: 'PRD',
        REC: 'HPR',
        INT: 'HPR',
        POC: 'POC',
        DEV: 'DEV'
      }[env] || '';
    },
    getGroupAffectationVIP(env) {
      return `GR-${env}${this.suffixAffectationVip}`;
    },
    getGroupAffectationSNAT(env) {
      return `GR-${env}${this.suffixAffectationSnat}`;
    },
    emitUpdate() {
      // Éviter les boucles infinies
      if (this.isUpdatingFromParent) return;
      
      this.isUpdatingFromParent = true;
      
      this.formatComposantNames();
      this.updateAllNomNetworkGroupVRA();
      this.generateGroupNames();
      
      this.$nextTick(() => {
        this.$emit('update:modelValue', [...this.localComposants]);
        this.isUpdatingFromParent = false;
      });
    }
  },
 
  mounted() {
    // Déclencher les calculs au montage si on a des données
    this.$nextTick(() => {
      if (this.localComposants.length > 0 && this.applicationData && Object.keys(this.applicationData).length > 0) {
        this.emitUpdate();
      }
    });
  }
};
</script>