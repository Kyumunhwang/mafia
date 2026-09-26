export const SCENARIOS = {
  classic: {
    id: 'classic',
    title: 'Classic Mafia',
    titleKo: '클래식 마피아',
    tag: 'Classic Noir',
    tagKo: '인기 테마 · 클래식',
    subtitle: 'Classic Noir Mystery',
    desc: 'On a foggy night in the city, an intense psychological battle between an organized crime syndicate and city detectives unfolds.',
    descKo: '안개 낀 밤, 범죄 조직과 도시 수사관들의 숨막히는 비밀 심리전이 시작됩니다.',
    bgImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-HXS0YiAMwAuiPmwWcmSoPmLbJlN24IM3TD3fb318ogaXrjDyrUxDcF5oRSLRWR1xr8RR-1SEAwTevl-OK_0uhclNxh_4JJEjrxheJzxKeUvDuTBl4TqELA65RUpHiCL5a31xIsuZOShkWS4dOx5Tbuc66Uy9KHJAJbRn7akZVqlpm71cqVn_jmaKEAjkPTT0WtwqYo92kQnkdtYBsmDAqqXdlBMWwJf4e3Hx8nTPGvR4yFtiivi5Nw',
    accentColor: 'primary',
    roles: {
      MAFIA: {
        name: 'Mafia',
        nameKo: '마피아',
        team: 'mafia',
        icon: 'target',
        desc: 'Selects 1 victim to eliminate each night.',
        descKo: '매일 밤 1명을 암살 대상으로 지목합니다.',
        color: 'text-primary',
        badgeBg: 'bg-primary-container/20'
      },
      POLICE: {
        name: 'Detective',
        nameKo: '경찰',
        team: 'citizen',
        icon: 'search',
        desc: 'Interrogates 1 suspect each night to determine if they are Mafia.',
        descKo: '매일 밤 1명의 마피아 여부를 비밀리에 취조합니다.',
        color: 'text-tertiary',
        badgeBg: 'bg-tertiary-container/20'
      },
      DOCTOR: {
        name: 'Doctor',
        nameKo: '의사',
        team: 'citizen',
        icon: 'healing',
        desc: 'Protects 1 person each night from assassination.',
        descKo: '매일 밤 1명을 암살로부터 보호합니다.',
        color: 'text-secondary',
        badgeBg: 'bg-secondary-container/20'
      },
      CITIZEN: {
        name: 'Good Citizen',
        nameKo: '선량한 시민',
        team: 'citizen',
        icon: 'diversity_3',
        desc: 'Deduces and roots out criminals through day discussion and voting.',
        descKo: '낮 토론과 투표로 범인을 추리하고 처형합니다.',
        color: 'text-on-surface',
        badgeBg: 'bg-surface-container-high'
      }
    }
  },
  school: {
    id: 'school',
    title: 'School Ghost Story',
    titleKo: '학교 괴담',
    tag: 'Occult Horror',
    tagKo: '오컬트 호러',
    subtitle: 'High School Mystery',
    desc: 'The 4th-floor music room lights up past midnight. An eerie curse has seeped into the classrooms.',
    descKo: '자정이 지나면 불이 켜지는 4층 음악실, 교내에 스며든 정체불명의 저주와 비행 학생들을 색출하라.',
    bgImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKk1S1dV7yEBi6zStSeHQd8WJhDcFqOGnxU3O2CjlW9tZ_4nrag6V2UYDOtA3DHCv8toH0mAN_CW8BC6ep1x7s6R2VUEWtwYmKzUbgsNeZvAGG2Wqc3lZ6YTU-exruD_XRJZYeYBrXIXfvDL1QRA7fOs-cq5iRZQY2o6qyLZ8A3zd3vg0c5RcFpEeEZfnK86O7cyiOAH-GJxt_PypYTXNCGpkBFYC0ktzYh9G24pwmTZs92_Jq8bEFOg',
    accentColor: 'secondary',
    roles: {
      MAFIA: {
        name: 'Delinquent',
        nameKo: '불량 학생',
        team: 'mafia',
        icon: 'sentiment_very_dissatisfied',
        desc: 'Picks a victim each midnight for the ghost ritual.',
        descKo: '자정마다 괴담의 희생양을 선택합니다.',
        color: 'text-primary',
        badgeBg: 'bg-primary-container/20'
      },
      POLICE: {
        name: 'Head Prefect',
        nameKo: '선도부장',
        team: 'citizen',
        icon: 'visibility',
        desc: 'Conducts surprise bag inspections to reveal cursed students.',
        descKo: '학생의 소지품을 불시 검문하여 정체를 확인합니다.',
        color: 'text-secondary',
        badgeBg: 'bg-secondary-container/20'
      },
      DOCTOR: {
        name: 'School Nurse',
        nameKo: '보건 선생님',
        team: 'citizen',
        icon: 'medical_services',
        desc: 'Treats 1 injured student using the emergency first-aid kit.',
        descKo: '구급 상자로 부상당한 학생 1명을 치료합니다.',
        color: 'text-tertiary',
        badgeBg: 'bg-tertiary-container/20'
      },
      CITIZEN: {
        name: 'Normal Student',
        nameKo: '일반 학생',
        team: 'citizen',
        icon: 'school',
        desc: 'Shares clues and votes to expel the instigators of the urban legend.',
        descKo: '교내 단서를 공유하고 괴담의 주동자를 투표로 처벌합니다.',
        color: 'text-on-surface',
        badgeBg: 'bg-surface-container-high'
      }
    }
  },
  space: {
    id: 'space',
    title: 'Spaceship Survival',
    titleKo: '우주선 서바이벌',
    tag: 'Sci-Fi Thriller',
    tagKo: 'SF 스릴러',
    subtitle: 'Deep Space Suspense',
    desc: 'Oxygen level at 12%. Mutated alien saboteurs have sabotaged the cryogenic pods aboard the vessel.',
    descKo: '산소 잔여량 12%, 동면 캡슐을 훼손한 변이 생명체를 찾아내 에어락으로 배출해야 합니다.',
    bgImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBb64qVOpq-ZjbMlUqF573U_L6B_yxboAIroybF4pLswAq8Nq21UBZndfYKtXbBDv60id-pcMP2BffN4CYQuhTRPX8Aq8WDQ3Se3GsfXKKGTVoqq5ssn_-ikjmsGHqTa7dKgd8Gpw4Y9m-KC0CwG56XNk66hGXT2IhmYHGGOvoDLZvDlERpFGtNYg0jhnKDYWe7vw7HAGXkG_FX12Dsjpe0rgt86FaqzKmPllBy1UF0sqwZkpaSLOHbjg',
    accentColor: 'tertiary',
    roles: {
      MAFIA: {
        name: 'Alien Saboteur',
        nameKo: '사보추어(외계인)',
        team: 'mafia',
        icon: 'pest_control',
        desc: 'Sabotages oxygen valves and terminates crew members each night.',
        descKo: '산소 밸브를 파괴하고 승무원을 암살합니다.',
        color: 'text-primary',
        badgeBg: 'bg-primary-container/20'
      },
      POLICE: {
        name: 'Ship Marshal',
        nameKo: '함선 보안관',
        team: 'citizen',
        icon: 'radar',
        desc: 'Scans crew bio-signatures to detect alien infection.',
        descKo: '생체 스캐너로 외계 감염 여부를 정밀 스캔합니다.',
        color: 'text-tertiary',
        badgeBg: 'bg-tertiary-container/20'
      },
      DOCTOR: {
        name: 'Medical Officer',
        nameKo: '군의관',
        team: 'citizen',
        icon: 'vaccines',
        desc: 'Activates emergency cryo-pod shielding to protect 1 crew member.',
        descKo: '응급 동면 캡슐을 가동해 승무원 1명을 보호합니다.',
        color: 'text-secondary',
        badgeBg: 'bg-secondary-container/20'
      },
      CITIZEN: {
        name: 'Astronaut Crew',
        nameKo: '우주비행사',
        team: 'citizen',
        icon: 'rocket_launch',
        desc: 'Repairs ship systems and votes to eject alien impostors.',
        descKo: '함선 시스템을 수리하고 비정상 개체 배출에 투표합니다.',
        color: 'text-on-surface',
        badgeBg: 'bg-surface-container-high'
      }
    }
  },
  vampire: {
    id: 'vampire',
    title: 'Vampire Castle',
    titleKo: '뱀파이어 성',
    tag: 'Gothic Dark Fantasy',
    tagKo: '고딕 다크 판타지',
    subtitle: 'Blood Moon Banquet',
    desc: 'Under the rising blood moon, vampires have infiltrated the cathedral banquet. Cleanse the darkness.',
    descKo: '붉은 달이 차오르는 밤, 만찬장에 숨어든 피의 군주들을 처단하고 영지를 구원하라.',
    bgImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuWlRczj166ahjSn5gfTKbgR7DN3VmPTalhLsxY20ug9KQBIuo26vGTElFEtTOTjtgUWz5Iug2dzZUhq7FyqZg4Jj8s4dEALNhExg1O9s6fbpmQ1x3QfM7rLChkyhrl6VnthmXsHnBvhpi3FSZB3ONHf_PQUMbOhDB9gFOfuH-fHJY2NAQvKW3aoDvS_CvIveiQfwqkShQ2qrYMRR1VjrTHKkr7dfkoz8YB9NC2bme6hchYmzb1_mHuw',
    accentColor: 'secondary-fixed',
    roles: {
      MAFIA: {
        name: 'Vampire Lord',
        nameKo: '피의 군주(뱀파이어)',
        team: 'mafia',
        icon: 'skull',
        desc: 'Drinks the blood of 1 mortal every midnight.',
        descKo: '매일 밤 인간 1명의 피를 흡혈합니다.',
        color: 'text-primary',
        badgeBg: 'bg-primary-container/20'
      },
      POLICE: {
        name: 'Vampire Hunter',
        nameKo: '퇴마사',
        team: 'citizen',
        icon: 'auto_fix_high',
        desc: 'Inspects a target with a consecrated silver cross to reveal dark blood.',
        descKo: '은제 십자가로 어둠의 피를 검증합니다.',
        color: 'text-secondary',
        badgeBg: 'bg-secondary-container/20'
      },
      DOCTOR: {
        name: 'White Mage',
        nameKo: '백마법사',
        team: 'citizen',
        icon: 'flare',
        desc: 'Casts a sacred barrier to shield 1 person from vampire feeding.',
        descKo: '성스러운 결계로 1명을 흡혈에서 보호합니다.',
        color: 'text-tertiary',
        badgeBg: 'bg-tertiary-container/20'
      },
      CITIZEN: {
        name: 'Castle Villager',
        nameKo: '영지민',
        team: 'citizen',
        icon: 'castle',
        desc: 'Interrogates suspects and condemns vampires to the stake.',
        descKo: '화형대에 올릴 의심스러운 자를 낮 재판에서 심문합니다.',
        color: 'text-on-surface',
        badgeBg: 'bg-surface-container-high'
      }
    }
  }
};
