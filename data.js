// ====== CONTENU DU SITE ROICAB ======
// Ce fichier est mis à jour automatiquement par le mode édition du site (bouton « Espace propriétaire »).
// Tu peux aussi le modifier à la main : garde les guillemets et les virgules.
window.SITE = {
  "profile": {
    "name": "Cabrel Fonkeu Nana",
    "title": "Étudiant Bachelor Informatique · Infrastructure, Systèmes & Réseaux",
    "location": "Nantes (44)",
    "about": "Étudiant en 2ᵉ année à l’EPSI Nantes, orienté infrastructure, réseaux et DevOps. Je monte et sécurise des architectures complètes (pare-feu redondants, VPN, annuaire, virtualisation) et j’automatise leur déploiement par script.",
    "available": true,
    "email": "Fonkeucabrel212@gmail.com",
    "phone": "",
    "linkedin": "https://www.linkedin.com/in/cabrel-fonkeu-nana-5928a7398",
    "github": "",
    "photo": "assets/photo.jpg",
    "photoV": 1793298704825
  },
  "skills": [
    {
      "cat": "Réseaux",
      "items": [
        "TCP/IP",
        "VLAN",
        "DHCP",
        "DNS",
        "Routage",
        "HSRP",
        "CARP",
        "VPN WireGuard",
        "Proxy Squid / SquidGuard"
      ]
    },
    {
      "cat": "Sécurité",
      "items": [
        "Pare-feu pfSense",
        "Durcissement Active Directory (PingCastle",
        "HardenAD)"
      ]
    },
    {
      "cat": "Systèmes & virtualisation",
      "items": [
        "Windows Server",
        "Active Directory",
        "GPO",
        "Linux Debian",
        "Apache",
        "MariaDB/MySQL",
        "Proxmox VE",
        "Vagrant"
      ]
    },
    {
      "cat": "Scripting & outils",
      "items": [
        "Bash",
        "PowerShell",
        "Git",
        "GLPI (support et gestion de parc)"
      ]
    },
    {
      "cat": "Développement",
      "items": [
        "HTML5/CSS3",
        "PHP",
        "SQL",
        "UML"
      ]
    }
  ],
  "projects": [
    {
      "title": "Haute disponibilité pfSense (CARP)",
      "status": "Terminé",
      "year": "2026",
      "summary": "Deux pare-feu pfSense en cluster CARP devant un serveur web en LAN, avec un client côté WAN.",
      "details": "Schéma réseau réalisé avec draw.io (nom, IP, masque et passerelle de chaque machine), captures d’écran et documentation technique pour le rendu.",
      "tags": [
        "pfSense",
        "CARP",
        "Pare-feu",
        "draw.io"
      ],
      "link": "",
      "id": "p1"
    },
    {
      "title": "VPN site à site WireGuard",
      "status": "En cours",
      "year": "2026",
      "summary": "Liaison entre un siège et une agence : deux pfSense reliés par un tunnel WireGuard à travers Internet.",
      "details": "VLAN 10 et 20 sur chaque site, avec serveur, switch et client, et plan d’adressage à définir.",
      "tags": [
        "WireGuard",
        "pfSense",
        "VLAN",
        "VPN"
      ],
      "link": "",
      "id": "p2"
    },
    {
      "title": "Domaine Active Directory",
      "status": "En cours",
      "year": "2026",
      "summary": "Forêt remoteworks.local sur Proxmox : deux contrôleurs de domaine et un client, GPO, profils itinérants, quotas et sauvegardes.",
      "details": "Audit de sécurité avec PingCastle ou HardenAD, et script PowerShell unique pour déployer les exercices 1 à 8.",
      "tags": [
        "Active Directory",
        "GPO",
        "PowerShell",
        "PingCastle",
        "Proxmox"
      ],
      "link": "",
      "id": "p3"
    },
    {
      "title": "Proxy Squid et SquidGuard",
      "status": "Terminé",
      "year": "2026",
      "summary": "Proxy Squid avec filtrage par blacklists de domaines et d’URL, et page de blocage personnalisée.",
      "details": "Environnement Vagrant avec une machine squid_proxy et une machine squid_client.",
      "tags": [
        "Squid",
        "SquidGuard",
        "Vagrant",
        "Proxy"
      ],
      "link": "",
      "id": "p4"
    },
    {
      "title": "Redondance HSRP",
      "status": "Terminé",
      "year": "2026",
      "summary": "Deux routeurs Cisco 4331 en HSRP sur deux VLAN (192.168.0.0/24 et 10.0.0.0/24), avec test de bascule.",
      "details": "Identification du routeur actif et du routeur en veille, puis coupure du routeur actif pour valider la bascule.",
      "tags": [
        "Cisco",
        "HSRP",
        "VLAN",
        "Redondance"
      ],
      "link": "",
      "id": "p7"
    },
    {
      "title": "Script de déploiement Bash",
      "status": "Terminé",
      "year": "2026",
      "summary": "Script qui prend l’IP d’une VM et un rôle (web, bdd, wordpress, firewall) et configure la machine par SSH.",
      "details": "Une fonction par rôle : Apache et PHP, MariaDB, WordPress, règles iptables. Mot de passe sudo saisi sans écho. Soutenance orale en groupe.",
      "tags": [
        "Bash",
        "SSH",
        "Apache",
        "MariaDB",
        "iptables"
      ],
      "link": "",
      "id": "p8"
    },
    {
      "title": "GLPI",
      "status": "Terminé",
      "year": "2026",
      "summary": "Installation de GLPI sur une VM Linux, gestion des entités, des profils et des utilisateurs pour deux entreprises fictives.",
      "details": "Étude des profils (Self-Service, Technician, Super-Admin) et gestion des utilisateurs par groupes.",
      "tags": [
        "GLPI",
        "Linux",
        "Support"
      ],
      "link": "",
      "id": "p9"
    },
    {
      "title": "Horloge parlante à capteur de mouvement",
      "status": "En cours",
      "year": "2026",
      "summary": "Un Raspberry Pi 4 détecte un mouvement et annonce l’heure avec une blague générée par une IA locale.",
      "details": "La blague est produite par Ollama (llama3.2) et convertie en voix avec Piper TTS sur une VM Proxmox, puis renvoyée au Raspberry Pi en MP3.",
      "tags": [
        "Raspberry Pi",
        "Ollama",
        "Piper TTS",
        "Python",
        "Proxmox"
      ],
      "link": "",
      "id": "p10"
    },
    {
      "title": "Modélisation UML et base de données",
      "status": "Terminé",
      "year": "2026",
      "summary": "Diagrammes de classes avec héritage et modèle relationnel pour une librairie et pour un vendeur d’aménagements d’utilitaires.",
      "details": "Produit en hiérarchie (équipements, meubles, kits), finitions, compatibilité véhicules, commandes et lignes de commande.",
      "tags": [
        "UML",
        "SQL",
        "Héritage"
      ],
      "link": "",
      "id": "p11"
    },
    {
      "title": "Application de transports routiers",
      "status": "Terminé",
      "year": "2026",
      "summary": "Règles métier, matrice des droits et user stories pour une application de suivi de camions et de trajets.",
      "details": "Trois rôles (administrateur, gestionnaire, chauffeur) et documentation versionnée sous Git dans un README.md.",
      "tags": [
        "Git",
        "User stories",
        "Markdown"
      ],
      "link": "",
      "id": "p12"
    }
  ],
  "cvs": [
    {
      "id": "rv6s11",
      "label": "cv_cabrel",
      "note": "nouveau cv",
      "date": "2026-10-29",
      "file": "cv/20261029-CV_Cabrel_Fonkeu_Nana-1-.pdf",
      "current": true
    }
  ],
  "docs": [
    {
      "id": "d1",
      "title": "Documentation pfSense en haute disponibilité (CARP)",
      "summary": "Schéma réseau, captures d’écran et explications de l’infrastructure en production, à rendre en PDF.",
      "status": "En cours",
      "date": "2026-10-29",
      "projectId": "p1",
      "file": "",
      "fileName": ""
    },
    {
      "id": "d2",
      "title": "Documentation Active Directory (remoteworks.local)",
      "summary": "Commandes, scripts et captures des exercices 1 à 8, avec l’audit PingCastle / HardenAD.",
      "status": "En cours",
      "date": "2026-10-29",
      "projectId": "p3",
      "file": "",
      "fileName": ""
    }
  ]
};
