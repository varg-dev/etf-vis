// Niemals mit Anteilen rechnen


// dividende immer nur eine ausschuettung am ende des jahres


// costfunction ersetzten mir parametern


// accumulating model
// Thesaurierend

// nur auf die dividende steuern zahlen: vorabpauschale

// start amount und monatlichen amount zusammenziehen.

/*
Input: 
- Aktuellen Wert der Etfs in EUR vom Ende des Vorzeitraums (v)
- vorhandene dividende d_split
- vorhandene taxes t 
- vorhandene costs c
- Monatliches Investment (m)
- kursgewinn l
- steuerfreibetrag ui parameter f

Calculation:

1. Kursentwicklung von v: g_1 = v * l
1.1 costs = costFunction(m)
1.2 costs_sum = costs * 12
1.3 m_cost = m - costs
2. iterate i for 12: g_2 += m_cost * l * i / 12 + 12 * m_cost (ueberpriefen mit excel pmt function) existierende funkion ist richtig
3. vorlaeufiger endwert: g_3 = g_1 + g_2
4. dividende: d_brutto = g_3 * 0.02
5. vorabpauschale: d_tax = min(d_brutto * 0.7 * 0.26..., )
6. d_tax_frei = max(0, d_tax - f)
7. d_netto = d_brutto - d_tax_frei


Endwerte:
v_neu = v_split + g_1 + g_2
d_split_neu = d_split + d_netto
t_neu = t + d_tax_frei
c_neu = c_split + costs * costs_sum


3. Gewinn: k = (g_1 - v) + (g_2 - 12 * m)

*/

// distributing model



// UI: keine animation redraw is ok.






// TODO: 1. accumulation model with non 1 year periods., dividend not visible, add missing ui elements.


// Ausschuettungsmodell

// keine umstellung von thesaurierer zu ausschuettener

// einfach etf anteile verkaufen mit zielbetrag

// steuerfrei, 