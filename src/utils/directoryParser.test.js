import { describe, it, expect } from 'vitest';
import {
  cleanPhone,
  parseBirthDate,
  cleanMemberName,
  naturalOrderName,
  isMembersSheetHeader,
  isFamiliesSheetHeader,
  parseIndividualMembersSheet,
  parseFamiliesSheet,
  correlateDirectory,
  parseDirectorySheets,
} from './directoryParser';

describe('directoryParser utility', () => {
  describe('cleanPhone', () => {
    it('formats 11-digit mobile numbers with Brazilian mask', () => {
      expect(cleanPhone('48999473969')).toBe('(48) 99947-3969');
      expect(cleanPhone('(48) 99947-3969')).toBe('(48) 99947-3969');
    });

    it('formats 10-digit landline numbers', () => {
      expect(cleanPhone('4832520038')).toBe('(48) 3252-0038');
    });

    it('handles scientific notation from Excel numbers', () => {
      expect(cleanPhone('4.891064478E9')).toBe('(48) 9106-4478');
      expect(cleanPhone(4884473098)).toBe('(48) 8447-3098');
    });

    it('handles Brazilian country code (+55)', () => {
      expect(cleanPhone('+5548999473969')).toBe('(48) 99947-3969');
      expect(cleanPhone('+554832520038')).toBe('(48) 3252-0038');
    });

    it('handles notes and text containing the letter e without scientific corruption', () => {
      expect(cleanPhone('Recado com Elaine: (48) 98888-7777')).toBe('(48) 98888-7777');
    });

    it('returns empty string for null/undefined/empty', () => {
      expect(cleanPhone(null)).toBe('');
      expect(cleanPhone('')).toBe('');
      expect(cleanPhone(undefined)).toBe('');
    });
  });

  describe('parseBirthDate', () => {
    it('handles JavaScript Date objects', () => {
      const d = new Date('2001-12-28T00:00:00.000Z');
      expect(parseBirthDate(d)).toBe('2001-12-28');
    });

    it('handles Excel serial numbers', () => {
      // 37253 corresponds to 2001-12-28
      expect(parseBirthDate(37253)).toBe('2001-12-28');
    });

    it('handles Brazilian date strings DD/MM/YYYY', () => {
      expect(parseBirthDate('28/12/2001')).toBe('2001-12-28');
      expect(parseBirthDate('9/1/2018')).toBe('2018-01-09');
    });

    it('handles textual Portuguese dates e.g. "28 dez. 2001"', () => {
      expect(parseBirthDate('28 dez. 2001')).toBe('2001-12-28');
      expect(parseBirthDate('9 jan. 2018')).toBe('2018-01-09');
    });
  });

  describe('cleanMemberName', () => {
    it('removes "Não Batizado" tag', () => {
      expect(cleanMemberName('Campos, Lucas Veneski DeNão Batizado')).toBe('Campos, Lucas Veneski De');
      expect(cleanMemberName('Lucas Veneski De Não batizado')).toBe('Lucas Veneski De');
    });

    it('removes age in parentheses at the end', () => {
      expect(cleanMemberName('Daniel Martins de (6)')).toBe('Daniel Martins de');
      expect(cleanMemberName('Lucas Veneski De (17)')).toBe('Lucas Veneski De');
    });
  });

  describe('naturalOrderName', () => {
    it('converts "Sobrenome, Nome" to "Nome Sobrenome"', () => {
      expect(naturalOrderName('Alcântara, Mariele Silva')).toBe('Mariele Silva Alcântara');
      expect(naturalOrderName('Alves, Danilo Simões')).toBe('Danilo Simões Alves');
    });

    it('correctly places Brazilian agnomes (Junior, Filho, Neto) at the end of the full name', () => {
      expect(naturalOrderName('Paz, Ronaldo Rocha Junior')).toBe('Ronaldo Rocha Paz Junior');
      expect(naturalOrderName('Ribeiro, João Vilmar, Junior')).toBe('João Vilmar Ribeiro Junior');
      expect(naturalOrderName('Silva, Carlos Eduardo Filho')).toBe('Carlos Eduardo Silva Filho');
      expect(naturalOrderName('Paz Junior, Ronaldo Rocha')).toBe('Ronaldo Rocha Paz Junior');
    });

    it('returns original if no comma present', () => {
      expect(naturalOrderName('Danilo Simões Alves')).toBe('Danilo Simões Alves');
    });
  });

  describe('Sheet header detection', () => {
    it('detects member sheet headers', () => {
      const header = ['Nome', 'Sexo', 'Idade', 'Data de Nascimento', 'Número de Telefone', 'E-mail'];
      expect(isMembersSheetHeader(header)).toBe(true);
      expect(isFamiliesSheetHeader(header)).toBe(false);
    });

    it('detects families sheet headers', () => {
      const header = ['Nome', 'Membros da Família', 'Endereço', 'Número de Telefone', 'E-mail'];
      expect(isFamiliesSheetHeader(header)).toBe(true);
      expect(isMembersSheetHeader(header)).toBe(false);
    });
  });

  describe('correlateDirectory', () => {
    it('correlates members and families with role assignment', () => {
      const members = [
        {
          tempId: 'mem_1',
          name: 'José Eduardo de Amorim',
          originalLcrName: 'Amorim, José Eduardo de',
          surname: 'Amorim',
          given: 'José Eduardo de',
          gender: 'M',
          age: 49,
          birthDate: '1977-01-06',
          phone: '(48) 93300-7316',
          email: 'ev.eduardoamorim47@gmail.com',
          active: true,
        },
        {
          tempId: 'mem_2',
          name: 'Elisandra Concelina Martins de Amorim',
          originalLcrName: 'Amorim, Elisandra Concelina Martins de',
          surname: 'Amorim',
          given: 'Elisandra Concelina Martins de',
          gender: 'F',
          age: 48,
          birthDate: '1977-12-07',
          phone: '(48) 99600-3653',
          email: 'elisandraamorim48@gmail.com',
          active: true,
        },
        {
          tempId: 'mem_3',
          name: 'Daniel Martins de Amorim',
          originalLcrName: 'Amorim, Daniel Martins de',
          surname: 'Amorim',
          given: 'Daniel Martins de',
          gender: 'M',
          age: 6,
          birthDate: '2020-04-02',
          phone: '',
          email: '',
          active: true,
        },
      ];

      const families = [
        {
          tempId: 'hh_1',
          name: 'Amorim, José Eduardo de & Elisandra Concelina Martins de',
          displayName: 'Amorim, José Eduardo de & Elisandra Concelina Martins de',
          headNames: 'Amorim, José Eduardo de & Elisandra Concelina Martins de',
          surname: 'Amorim',
          address: 'R Prof. Sávio João Broering, 45\n88140-000 Santo Amaro da Imperatriz - SC',
          phone: '(48) 93300-7316',
          email: 'ev.eduardoamorim47@gmail.com',
          active: true,
          memberLines: [
            'José Eduardo de',
            'Elisandra Concelina Martins de',
            'Daniel Martins de (6)',
          ],
          memberTempIds: [],
        },
      ];

      const result = correlateDirectory(members, families);
      expect(result.stats.correlationRate).toBe(100);
      expect(result.stats.matchedLines).toBe(3);

      const mem1 = result.members.find((m) => m.tempId === 'mem_1');
      const mem2 = result.members.find((m) => m.tempId === 'mem_2');
      const mem3 = result.members.find((m) => m.tempId === 'mem_3');

      expect(mem1.householdRole).toBe('head');
      expect(mem1.tempHouseholdId).toBe('hh_1');

      expect(mem2.householdRole).toBe('spouse');
      expect(mem2.tempHouseholdId).toBe('hh_1');

      expect(mem3.householdRole).toBe('child');
      expect(mem3.tempHouseholdId).toBe('hh_1');
    });

    it('handles single-member families as head', () => {
      const members = [
        {
          tempId: 'mem_1',
          name: 'Mariele Silva Alcântara',
          originalLcrName: 'Alcântara, Mariele Silva',
          surname: 'Alcântara',
          given: 'Mariele Silva',
          gender: 'F',
          age: 24,
          active: true,
        },
      ];

      const families = [
        {
          tempId: 'hh_1',
          name: 'Alcântara, Mariele Silva',
          surname: 'Alcântara',
          memberLines: ['Mariele Silva'],
          memberTempIds: [],
        },
      ];

      const result = correlateDirectory(members, families);
      expect(result.stats.matchedLines).toBe(1);
      expect(result.members[0].householdRole).toBe('head');
    });

    it('synthesizes members from families sheet when members sheet is absent', () => {
      const families = [
        {
          tempId: 'hh_1',
          name: 'Amorim, José & Elisandra',
          displayName: 'Amorim, José & Elisandra',
          surname: 'Amorim',
          phone: '(48) 93300-7316',
          email: 'eduardo@example.com',
          memberLines: ['José', 'Elisandra', 'Daniel (6)'],
          memberTempIds: [],
        },
      ];

      const result = correlateDirectory([], families);
      expect(result.members).toHaveLength(3);
      expect(result.households).toHaveLength(1);
      expect(result.members[0].name).toBe('José Amorim');
      expect(result.members[0].householdRole).toBe('head');
      expect(result.members[1].householdRole).toBe('spouse');
      expect(result.members[2].name).toBe('Daniel Amorim');
      expect(result.members[2].age).toBe(6);
      expect(result.members[2].householdRole).toBe('child');
      expect(result.stats.correlationRate).toBe(100);
    });

    it('correlates household head with Brazilian agnomes (e.g. Ronaldo Rocha Paz Junior)', () => {
      const members = [
        {
          tempId: 'mem_1',
          name: 'Ronaldo Rocha Paz Junior',
          originalLcrName: 'Paz, Ronaldo Rocha Junior',
          surname: 'Paz',
          given: 'Ronaldo Rocha Junior',
          gender: 'M',
          age: 38,
          active: true,
        },
        {
          tempId: 'mem_2',
          name: 'Natália Vicari Faleiro Paz',
          originalLcrName: 'Paz, Natália Vicari Faleiro',
          surname: 'Paz',
          given: 'Natália Vicari Faleiro',
          gender: 'F',
          age: 35,
          active: true,
        },
        {
          tempId: 'mem_3',
          name: 'Sara Faleiro Paz',
          originalLcrName: 'Paz, Sara Faleiro',
          surname: 'Paz',
          given: 'Sara Faleiro',
          gender: 'F',
          age: 2,
          active: true,
        },
      ];

      const families = [
        {
          tempId: 'hh_1',
          name: 'Paz, Ronaldo Rocha & Natália Vicari Faleiro',
          displayName: 'Paz, Ronaldo Rocha & Natália Vicari Faleiro',
          headNames: 'Paz, Ronaldo Rocha & Natália Vicari Faleiro',
          surname: 'Paz',
          memberLines: [
            'Ronaldo Rocha Paz Junior',
            'Natália Vicari Faleiro',
            'Sara Faleiro (2)',
          ],
          memberTempIds: [],
        },
      ];

      const result = correlateDirectory(members, families);
      expect(result.stats.correlationRate).toBe(100);
      expect(result.stats.matchedLines).toBe(3);

      const head = result.members.find((m) => m.tempId === 'mem_1');
      expect(head.householdRole).toBe('head');
      expect(head.tempHouseholdId).toBe('hh_1');

      const spouse = result.members.find((m) => m.tempId === 'mem_2');
      expect(spouse.householdRole).toBe('spouse');
      expect(spouse.tempHouseholdId).toBe('hh_1');

      const child = result.members.find((m) => m.tempId === 'mem_3');
      expect(child.householdRole).toBe('child');
      expect(child.tempHouseholdId).toBe('hh_1');
    });
  });

  describe('parseIndividualMembersSheet and parseFamiliesSheet', () => {
    it('parses members rows correctly', () => {
      const rows = [
        ['Nome', 'Sexo', 'Idade', 'Data de Nascimento', 'Número de Telefone', 'E-mail'],
        ['Alcântara, Mariele Silva', 'F', 24, '28/12/2001', '(48) 99947-3969', 'silva@example.com'],
      ];
      const parsed = parseIndividualMembersSheet(rows);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('Mariele Silva Alcântara');
      expect(parsed[0].age).toBe(24);
      expect(parsed[0].birthDate).toBe('2001-12-28');
      expect(parsed[0].gender).toBe('F');
    });

    it('parses families rows correctly', () => {
      const rows = [
        ['Nome', 'Membros da Família', 'Endereço', 'Número de Telefone', 'E-mail'],
        ['Alves, Danilo Simões', 'Danilo Simões', 'Rua do Ipê, 193', '(47) 98872-6856', ''],
      ];
      const parsed = parseFamiliesSheet(rows);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('Alves, Danilo Simões');
      expect(parsed[0].memberLines).toEqual(['Danilo Simões']);
      expect(parsed[0].address).toBe('Rua do Ipê, 193');
    });

    it('parses multi-sheet payload through parseDirectorySheets', () => {
      const sheets = [
        {
          sheet: 'Membros',
          data: [
            ['Nome', 'Sexo', 'Idade', 'Data de Nascimento', 'Número de Telefone', 'E-mail'],
            ['Alves, Danilo Simões', 'M', 32, '20/07/1994', '(47) 98872-6856', 'danilo@example.com'],
          ],
        },
        {
          sheet: 'Famílias',
          data: [
            ['Nome', 'Membros da Família', 'Endereço', 'Número de Telefone', 'E-mail'],
            ['Alves, Danilo Simões', 'Danilo Simões', 'Rua do Ipê, 193', '(47) 98872-6856', ''],
          ],
        },
      ];

      const result = parseDirectorySheets(sheets);
      expect(result.members).toHaveLength(1);
      expect(result.households).toHaveLength(1);
      expect(result.stats.correlationRate).toBe(100);
    });
  });
});
