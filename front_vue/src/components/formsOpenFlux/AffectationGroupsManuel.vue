<template>
  <div>
    <!-- Tableau d'affectation de groupes personnalisés -->
    <v-card class="pa-2 mb-3" outlined>
      <v-card-title class="text-h6">Affection de groupes (Saisie manuelle)</v-card-title>
      <v-table density="compact" class="elevation-1">
        <thead>
          <tr>
            <th scope="col">Groupe consommation</th>
            <th scope="col">À Affecter au Groupe de "Service"</th>
            <th scope="col"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(entry, index) in dynamicAffectationRows" :key="`row-${index}`">
            <td>
              <div class="d-flex flex-column">
                <div
                  v-for="(value, i) in entry.values"
                  :key="i"
                  class="d-flex align-center mb-1"
                >
                  <v-text-field
                    v-model="entry.values[i]"
                    density="compact"
                    variant="outlined"
                    hide-details
                    class="flex-grow-1"
                    @blur="syncAffectation"
                    @keyup.enter="syncAffectation"
                  />
                  <v-btn
                    icon
                    size="small"
                    color="error"
                    variant="text"
                    class="ml-1"
                    @click="removeGroupInput(index, i)"
                    v-if="entry.values.length > 1"
                  >
                    <v-icon>mdi-minus</v-icon>
                  </v-btn>
                </div>
                <v-btn
                  size="x-small"
                  variant="text"
                  color="primary"
                  @click="addGroupInput(index)"
                >
                  <v-icon start>mdi-plus</v-icon>
                  Ajouter un groupe
                </v-btn>
              </div>
            </td>

            <td>
              <v-text-field
                v-model="entry.key"
                density="compact"
                variant="outlined"
                hide-details
                class="flex-grow-1"
                @blur="syncAffectation"
                @keyup.enter="syncAffectation"
              />
            </td>

            <td>
              <v-btn
                icon
                color="error"
                variant="text"
                @click="removeLine(index)"
                title="Supprimer la ligne"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>

      <v-btn color="primary" class="mt-2" @click="addLine">
        <v-icon start>mdi-plus</v-icon>
        Ajouter une ligne
      </v-btn>
    </v-card>
  </div>
</template>

<script>
export default {
  name: 'AffectationGroupes',
  props: {
    modelValue: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      affectationGroupsInputs: {},
      dynamicAffectationRows: [],
      debounceTimer: null
    };
  },
  watch: {
    modelValue: {
      handler(newVal) {
        if (JSON.stringify(newVal) !== JSON.stringify(this.affectationGroupsInputs)) {
          this.initDynamicRows(newVal);
        }
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
   
    initDynamicRows(affectationData) {
      // Initialiser les lignes dynamiques avec les données existantes
      this.dynamicAffectationRows = [];
     
      if (affectationData && typeof affectationData === 'object') {
        Object.entries(affectationData).forEach(([key, values]) => {
          if (Array.isArray(values)) {
            this.dynamicAffectationRows.push({
              key,
              values: [...values]
            });
          }
        });
      }
    },
   
    syncAffectation() {
      // Annuler le timer précédent s'il existe
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      
      // Délai pour éviter les mises à jour trop fréquentes
      this.debounceTimer = setTimeout(() => {
        const updated = {};
        this.dynamicAffectationRows.forEach(entry => {
          const key = entry.key.trim();
          if (key && entry.values.some(v => v.trim() !== '')) {
            updated[key] = [...entry.values];
          }
        });
        this.affectationGroupsInputs = updated;
        this.$emit('update:modelValue', updated);
      }, 300);
    },
   
    syncAffectationImmediate() {
      // Version immédiate pour les boutons
      const updated = {};
      this.dynamicAffectationRows.forEach(entry => {
        const key = entry.key.trim();
        if (key && entry.values.some(v => v.trim() !== '')) {
          updated[key] = [...entry.values];
        }
      });
      this.affectationGroupsInputs = updated;
      this.$emit('update:modelValue', updated);
    },
   
    addLine() {
      this.dynamicAffectationRows.push({
        key: `Service ${this.dynamicAffectationRows.length + 1}`,
        values: ['']
      });
      this.syncAffectationImmediate();
    },
   
    removeLine(index) {
      this.dynamicAffectationRows.splice(index, 1);
      this.syncAffectationImmediate();
    },
   
    addGroupInput(rowIndex) {
      this.dynamicAffectationRows[rowIndex].values.push('');
      this.syncAffectationImmediate();
    },
   
    removeGroupInput(rowIndex, valIndex) {
      const row = this.dynamicAffectationRows[rowIndex];
      row.values.splice(valIndex, 1);
      if (row.values.length === 0) {
        this.removeLine(rowIndex);
      } else {
        this.syncAffectationImmediate();
      }
    },
   
    updateGroupKey() {
      this.syncAffectation();
    },
   
    mapGroupAffectionEnv(env) {
      return {
        PRD: 'PRD',
        PPR: 'PRD',
        REC: 'HPR',
        INT: 'HPR',
        POC: 'HPR',
        DEV: 'HPR'
      }[env] || '';
    }
  },
 
  mounted() {
    this.initDynamicRows(this.modelValue);
  },
  
  beforeUnmount() {
    // Nettoyer le timer si le composant est détruit
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }
};
</script>