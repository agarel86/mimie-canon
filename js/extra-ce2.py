# -*- coding: utf-8 -*-
"""Génère EXTRA_CE2 + adjectifs + verbes, les injecte dans build-words.mjs."""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "build-words.mjs"

GROUPS = {
    "animal": """
        agneau alouette antilope autruche bison blaireau bouc buse cabri
        caméléon canari castor cerf chacal chameau chamois chaton chiot cigale
        cigogne colibri corbeau crabe crevette daim dindon dromadaire faisan
        faucon flamant fouine frelon gazelle geai gorille guêpe hippocampe
        hyène iguane jaguar léopard lièvre loutre lynx manchot marmotte méduse
        merle moineau morse mouche mouette mule orque otarie ouistiti panthère
        paon pélican perruche pie pinson pieuvre poney porc poulain poulpe puce
        puma rat raton laveur renne rossignol sauterelle scorpion taupe taureau
        têtard toucan truite vautour veau vipère vison yak bœuf dinde faisane
        fauve furet girafeau hamac skip skip skip
        limace loir macaque moustique oie panthère perdrix pigeon pintade
        porcelet ragondin ramier sardine saumon silure souriceau tarentule
        tique truies vachette vermisseau
    """,
    "repas": """
        abricot ail amande ananas artichaut asperge aubergine avocat baguette
        basilic betterave brocoli brioche cacao café cannelle caramel cassis
        céleri céréale chou-fleur concombre cornichon couscous croissant datte
        épinard farine figue flan framboise gaufre haricot huile jambon kiwi
        lasagne lentille limonade maïs mandarine mangue mayonnaise melon
        meringue menthe mousse moutarde mûre noisette noix nouille oignon olive
        pamplemousse pastèque pêche poireau poivron potage potiron poulet prune
        radis ravioli sirop sucre thé vinaigre chouette skip
        céréales chips compote cornichons couscouss skip
        crumble daube éclair épinards fromage blanc galette gaufrette
        grenadine haricots hachis lasagnes macaroni madeleine merguez muesli
        nougat omelette pain d'épices pâtisserie petit-pois pizza popcorn
        pot-au-feu quiche ragoût ravioles risotto saucisse saucisson sorbet
        soufflé steak tartelette toast vanille yaourt à boire
        clémentine groseille myrtille nectarine pamplemousses
        brochettes cassoulet choucroute fondue gratin lasagnes
        croissant chocolatine pain au chocolat brioche sucrée
        eau minérale jus soda sirop d'érable
    """,
    "maison": """
        baignoire balcon cave grenier garage palier couloir bureau étagère
        évier four gazinière lavabo meuble moquette parquet plafond placard
        radiateur robinet tabouret tiroir vase ventilateur véranda volet
        allumette bouteille boîte bocal brosse cafetière canapé coffre commode
        drap éponge fauteuil figurine jouet linge nappe panier peigne pinceau
        seau télévision torchon vaisselle alarme antenne aquarium armoire skip
        bibliothèque skip
        bougeoir broc buffet candélabre skip
        cheminée clou corbeille crédence cuisinière dessous-de-plat
        détecteur douche escalier skip
        étagères frigo grill huche interrupteur jerrican skip
        literie loquet lucarne lustre marteau mezzanine moulure niche
        panneau paravent pergola persienne penderie portefeuille skip
        poubelle skip
        rambarde rangement rideaux skip
        sèche-linge sèche-serviettes soffite skip
        store tapisserie terrasse thermostat toiture tourelle
        vasistas velux verrou vestiaire vide-ordures
        casserole skip
        saladier soupière théière tire-bouchon
        torchon skip
        balai skip
        serpillière seau skip
        lessive savon shampoing dentifrice
        oreiller skip
        traversin édredon alèse
        cadre photo horloge skip
        réveil skip
        lampe skip
        ampoule interrupteur skip
        prise électrique rallonge
        vis écrou clou visseuse perceuse scie marteau skip
        pince tournevis niveau skip
        échelle escabeau
    """,
    "école": """
        alphabet atelier bulletin cantine classeur concierge copie craie
        dictée diplôme dossier écolier évaluation examen fiche graphe
        livret manuel matière poème rentrée réfectoire règlement sac
        savon trimestre uniforme vocabulaire conjugaison grammaire
        paragraphe récitation résumé syllabe voyelle consonne verbe sujet
        complément ponctuation atlas chapitre bande dessinée écolière
        instituteur institutrice récré interclasse tableau skip
        ardoise skip
        gommette pince pochette thème travail
        cahier de textes classeur skip
        crayon de couleur feutre skip
        colle skip
        ciseaux skip
        compas skip
        équerre skip
        rapporteur règle skip
        taille-crayon skip
        cartable skip
        trousse skip
        stylo skip
        surligneur crayon-feutre
        papier carton canson calque
        fiche bristol
        calculatrice boulier
        globe mappemonde
        microscope loupe
        tablier blouse
        casier vestiaire skip
        préau cour de récréation
        gymnase skip
        bibliothèque skip
        CDI documentation
        directeur skip
        directrice skip
        surveillant AESH
        copain copine
        leçon skip
        devoir skip
        exercice skip
        contrôle interrogation
        moyenne bulletin skip
        trimestre skip
        rentrée skip
        sortie scolaire
        kermesse carnaval
        chorale orchestre
        atelier skip
        bricolage modelage
        pâte à modeler
        peinture skip
        pinceau skip
        palette
        recette skip
        problème skip
        opération soustraction multiplication division
        fraction périmètre aire volume
        géométrie skip
        droite skip
        segment angle
        cube pavé sphère cylindre
        lecture skip
        écriture skip
        orthographe skip
        vocabulaire skip
        rédaction
        poésie skip
        fable conte skip
        roman album
        personnage skip
        auteur illustrateur
        éditeur collection
    """,
    "ville": """
        aéroport allée arrêt autoroute avenue boulevard camping cathédrale
        centre chantier cirque clinique commissariat cour crèche ferme
        fontaine gymnase hôtel immeuble kiosque librairie marché monument
        parking passage patinoire péage port poste quai quartier restaurant
        rond-point square station supermarché terrain tour tunnel usine zoo
        auberge boutique brasserie cafeteria skip
        cafeteria skip
        cathedral skip
        collège lycée université
        crèche skip
        école skip
        église skip
        mosquée synagogue temple
        hôpital skip
        clinique skip
        cabinet médical
        dentiste skip
        pharmacie skip
        boulangerie skip
        pâtisserie skip
        boucherie poissonnerie fromagerie
        épicerie supermarché skip
        marché skip
        halles
        magasin skip
        boutique skip
        coiffeur skip
        pressing
        banque poste skip
        mairie skip
        préfecture tribunal
        caserne caserne de pompiers
        commissariat skip
        gendarmerie
        gare skip
        station de métro
        arrêt de bus
        parking skip
        garage skip
        station-service
        péage skip
        autoroute skip
        nationale départementale
        chemin skip
        sentier skip
        piste cyclable
        trottoir skip
        passage piéton
        feu tricolore
        panneau skip
        panneau stop
        rond-point skip
        carrefour skip
        pont skip
        tunnel skip
        viaduc
        port skip
        quai skip
        phare jetée
        plage skip
        piscine skip
        stade skip
        gymnase skip
        dojo
        hippodrome
        palais des sports
        cinéma skip
        théâtre skip
        opéra musée skip
        galerie
        bibliothèque skip
        médiathèque
        kiosque skip
        square skip
        jardin public
        parc skip
        bois skip
        forêt skip
        zoo skip
        aquarium skip
        cirque skip
        fête foraine
        manège
        château skip
        donjon
        rempart
        fontaine skip
        statue
        monument skip
        calvaire
        cimetière
        mairie skip
    """,
    "nature": """
        air algue argile baie bois bouquet brouillard buisson cactus cascade
        caverne cèdre cerisier climat côte cratère cristal dune éclair écorce
        étang fougère galet glacier golfe grêle grotte hêtre horizon jungle
        lagune lave lilas lys marais marée minéral nénuphar oasis orme
        paysage pétale pin pollen pommier poirier pré puits ronce sève source
        tempête torrent trèfle vallée vague vapeur verger vigne averse
        bourgeon brise canyon colline skip
        delta éboulis écluse
        estuaire falaise fjord geyser geyser skip
        givre gouffre
        gravier gravier skip
        marécage
        météore
        olivier orage skip
        orge palétuvier skip
        palmeraie palmiers
        plateau skip
        prairie skip
        récif
        rivage
        rocher skip
        savane
        steppe
        taïga
        toundra
        tsunami
        volcan skip
        geyser skip
        iceberg
        banquise
        glacier skip
        avalanche
        sécheresse
        inondation
        crue
        marée skip
        ressac
        écume
        algue skip
        corail
        récif skip
        atoll
        îlot
        presqu'île
        cap skip
        golfe skip
        baie skip
        rade
        anse
        crique
        calanque
        fjord skip
        canyon skip
        gorge skip
        ravin
        vallon
        plaine
        plateau skip
        meseta skip
        pampa
        steppe skip
        désert skip
        oasis skip
        dune skip
        erg
        hamada skip
        savane skip
        jungle skip
        mangrove
        taïga skip
        toundra skip
        forêt skip
        bois skip
        bosquet
        haie
        buisson skip
        fourré
        taillis
        clairière
        lisière
        sous-bois
        humus
        terreau
        limon
        argile skip
        sable skip
        galet skip
        caillou skip
        roche
        granit
        calcaire
        schiste
        basalte
        lave skip
        magma
        cratère skip
        cheminée skip
        fumarole
        geyser skip
        source skip
        puits skip
        nappe
        aquifère skip
        rivière skip
        fleuve
        ruisseau
        torrent skip
        cascade skip
        chute
        cataracte skip
        lac skip
        étang skip
        mare
        marais skip
        tourbière
        lagune skip
        mer skip
        océan skip
        golfe skip
    """,
    "corps": """
        cil clavicule colonne côte coude crâne cuisse estomac hanche
        mâchoire mollet muscle nombril nuque organe paupière poitrine pouce
        poumon sourcil talon tempe thorax veine cerveau gorge aisselle
        biceps mollet skip
        tendon
        cartilage
        articulation
        colonne vertébrale
        omoplate
        bassin
        fémur
        tibia
        péroné skip
        radius
        cubitus
        phalange
        métacarpe skip
        métatarse skip
        rotule
        ménisque skip
        ligament
        tendon skip
        muscle skip
        biceps skip
        triceps
        abdomen
        diaphragme skip
        poumons skip
        bronches
        trachée
        larynx
        pharynx skip
        fosses nasales
        sinus skip
        tympan
        cochlée skip
        rétine
        cornée
        iris
        pupille
        cristallin skip
        nerf
        moelle skip
        cerveau skip
        cervelet
        méninges skip
        crâne skip
        fontanelle skip
        mâchoire skip
        gencive
        palais
        luette
        amygdale
        oesophage
        estomac skip
        foie skip
        vésicule skip
        pancréas
        rate
        intestin
        côlon
        rectum skip
        rein
        vessie
        uretère skip
        artère
        veine skip
        capillaire
        sang skip
        plasma skip
        globule
        plaque skip
        cœur skip
        oreillette
        ventricule
        valve skip
        aorte
        pouls
        tension
        température skip
        fièvre
        toux
        rhume
        grippe
        varicelle
        rougeole
        oreillons
        angine
        otite
        caries
        fracture
        entorse
        plaie
        cicatrice
        bleu skip
        bosse
        bouton skip
        acné skip
        allergie
        asthme
        diabète skip
        vitamine
        calcium
        fer skip
        protéine
        glucide
        lipide
        calorie
        digestion
        respiration
        circulation
        reproduction skip
        croissance
        sommeil skip
        rêve skip
        cauchemar
        bâillement
        éternuement
        hoquet
        frisson
        transpiration
        larme skip
        sueur
        salive
        mucus skip
        bile skip
    """,
    "vêtement": """
        anorak botte brassard cape chapeau chausson collant cravate culotte
        doudoune foulard gilet jean kimono laine pantoufle parka sandale
        short veste visière bermuda blouse salopette tong uniforme k-way
        polo tee-shirt sweat tennis baskets mocassin espadrille bottine
        cuissarde skip
        collants
        collant skip
        collier
        bracelet
        boucle d'oreille
        bague
        montre
        lunettes
        soleil skip
        casque
        casquette skip
        béret
        chapeau skip
        capuche
        capuchon
        écharpe skip
        cache-nez
        cache-cou
        gants skip
        moufle
        mitaine
        ceinture skip
        bretelle
        bretelles
        nœud skip
        nœud papillon
        cravate skip
        foulard skip
        étole
        châle
        cape skip
        poncho
        manteau skip
        pardessus
        trench
        imperméable
        ciré
        k-way skip
        doudoune skip
        blouson
        veste skip
        gilet skip
        cardigan
        pull skip
        sweat skip
        hoodie skip
        chemise skip
        chemisier
        blouse skip
        tunique
        t-shirt
        polo skip
        débardeur
        body skip
        pyjama skip
        chemise de nuit
        peignoir
        robe de chambre
        combinaison
        salopette skip
        overall skip
        pantalon skip
        jean skip
        fuseau
        jogging
        short skip
        bermuda skip
        jupe skip
        minijupe
        robe skip
        robe de soirée
        costume
        smoking skip
        uniforme skip
        tablier skip
        blouse skip
        chaussette skip
        collants skip
        bas
        collant skip
        chaussure skip
        basket
        tennis skip
        basket skip
        running skip
        crampon
        crampons
        roller
        patin
        ski skip
        snow skip
        snowboot skip
        après-ski
        botte skip
        bottine skip
        richelieu skip
        derbies skip
        mocassin skip
        ballerine
        escarpin skip
        sandale skip
        tong skip
        claquette
        nu-pieds
        chausson skip
        pantoufle skip
        charentaise
    """,
    "sport": """
        athlétisme badminton basket boxe canoë course cyclisme danse
        équitation escrime football gymnastique handball hockey judo karaté
        kayak natation parachute patinage rugby ski surf tennis volleyball
        yoga but filet match médaille nageur podium raquette sport trophée
        victoire arbitre entraîneur équipe joueur joueuse entraînement
        champion championne compétition finale demi-finale quart
        record recordman skip
        stade skip
        terrain skip
        piste
        circuit
        gymnase skip
        dojo skip
        piscine skip
        bassin skip
        plongeoir
        starting-block skip
        plots
        couloir skip
        haie skip
        relais
        marathon
        sprint
        cross
        footing
        jogging skip
        musculation
        haltère
        haltérophilie
        lutte
        catch skip
        boxe skip
        kickboxing skip
        karaté skip
        judo skip
        taekwondo
        aïkido
        kung-fu
        capoeira
        escrime skip
        fleuret
        épée
        sabre
        tir à l'arc
        arc skip
        flèche
        carquois
        stand de tir
        ball-trap skip
        golf
        club skip
        tee skip
        green skip
        putting skip
        tennis skip
        tennis de table
        ping-pong
        raquette skip
        balle skip
        volant
        badminton skip
        squash
        pelote skip
        baseball
        softball skip
        cricket
        cricket skip
        hockey skip
        hockey sur glace
        crosse
        palet
        patin skip
        patinage skip
        patinage artistique
        danse sur glace
        curling skip
        bobsleigh
        luge
        skeleton skip
        ski skip
        ski alpin
        ski de fond
        saut à ski
        biathlon
        snowboard
        surf skip
        planche skip
        voile skip
        régate
        dériveur
        catamaran
        planche à voile
        kitesurf
        paddle
        kayak skip
        canoë skip
        rafting
        aviron
        rame
        barque skip
        plongée
        tuba
        palme
        combinaison skip
        masque skip
        bouteille skip
        apnée
        water-polo
        natation skip
        brasse
        crawl
        papillon skip
        dos crawlé
        nage libre
        cyclisme skip
        vélo skip
        VTT
        cyclo-cross
        piste skip
        velodrome skip
        peloton
        maillot jaune
        étape
        tour skip
        football skip
        soccer skip
        gardien
        défenseur
        milieu skip
        attaquant
        avant-centre
        penalty
        corner
        hors-jeu
        carton
        carton jaune
        carton rouge
        sifflet
        arbitre skip
        assistant skip
        rugby skip
        essai skip
        mêlée
        touche skip
        transformation skip
        drop skip
        basketball skip
        basket skip
        panier skip
        dunk skip
        dribble
        passe skip
        rebond
        handball skip
        volleyball skip
        smash
        service skip
        réception skip
        contre skip
        pétanque
        boule skip
        cochonnet
        bowling
        quille
        billard
        queue skip
        bande skip
        échecs
        pion skip
        tour skip
        fou skip
        cavalier
        dame skip
        roi skip
        échec skip
        mat skip
        dame skip
        dames skip
        jeu de dames
        cartes skip
        tarot
        belote
        poker skip
        monopoly skip
        puzzle
        loto
        bingo skip
        dé skip
        dés
        pion skip
        plateau skip
        pion skip
        jeton
        dé skip
    """,
    "métier": """
        architecte artiste astronaute auteur avocat boucher coiffeur
        coiffeuse commerçant conducteur dentiste électricien écrivain fermier
        fleuriste informaticien ingénieur jardinier journaliste juge libraire
        maçon mécanicien menuisier musicien pâtissier peintre plombier
        soldat serveur serveuse tailleur vétérinaire chauffeur chimiste clown
        danseur dessinateur docteur sage-femme secrétaire instituteur
        institutrice skip
        professeur skip
        maître skip
        maîtresse skip
        directeur skip
        directrice skip
        inspecteur
        chercheur
        scientifique
        physicien
        chimiste skip
        biologiste
        géologue
        astronome
        météorologiste
        océanographe skip
        archéologue
        historien
        géographe
        philosophe skip
        sociologue skip
        psychologue
        psychiatre skip
        médecin skip
        chirurgien
        anesthésiste
        radiologue
        pharmacien
        infirmier skip
        infirmière skip
        aide-soignant
        sage-femme skip
        kinésithérapeute
        ostéopathe skip
        dentiste skip
        orthodontiste skip
        opticien
        vétérinaire skip
        éleveur
        agriculteur skip
        maraîcher
        viticulteur
        arboriculteur
        pêcheur
        marin
        skipper
        capitaine
        commandant
        amiral skip
        soldat skip
        militaire
        officier
        sergent
        colonel
        général
        gendarme
        policier skip
        policière
        gardien de la paix
        douanier
        pompier skip
        sapeur-pompier
        secouriste
        sauveteur
        maître-nageur
        sauveteur skip
        pilote skip
        hôtesse de l'air
        steward
        contrôleur
        aiguilleur
        chauffeur skip
        taxi
        chauffeur de bus
        routier
        livreur
        facteur skip
        postier
        messager
        coursier
        déménageur
        magasinier
        caissier
        caissière
        vendeur
        vendeuse
        commerçant skip
        marchand
        forain
        artisan
        boulanger skip
        pâtissier skip
        boucher skip
        charcutier
        poissonnier
        fromager
        épicier
        traiteur
        cuisinier skip
        chef
        pâtissier skip
        sommelier skip
        serveur skip
        serveuse skip
        barman
        barista skip
        restaurateur
        hôtelier
        concierge skip
        réceptionniste
        femme de chambre
        agent d'entretien
        éboueur
        jardiner skip
        jardinier skip
        paysagiste
        forestier
        garde forestier
        garde champêtre skip
        garde-chasse
        naturaliste
        guide
        accompagnateur
        moniteur
        entraîneur skip
        coach skip
        professeur de sport
        éducateur
        animateur
        animatrice
        clown skip
        magicien
        prestidigitateur skip
        comédien
        acteur
        actrice
        cascadeur
        metteur en scène
        réalisateur
        caméraman
        photographe
        journaliste skip
        reporter
        rédacteur
        éditeur skip
        imprimeur
        relieur
        libraire skip
        bibliothécaire
        documentaliste
        archiviste
        secrétaire skip
        assistant
        assistante
        comptable
        expert-comptable
        banquier
        assureur
        notaire
        avocat skip
        avocate
        juge skip
        huissier
        greffier
        maire skip
        député
        sénateur skip
        ministre
        président
        ambassadeur
        diplomate
        traducteur
        interprète
        linguiste skip
        écrivain skip
        poète
        romancier
        auteur skip
        scénariste
        dessinateur skip
        illustrateur skip
        peintre skip
        sculpteur
        graveur
        céramiste
        verrier
        souffleur skip
        ébéniste
        menuisier skip
        charpentier
        couvreur
        maçon skip
        plâtrier
        peintre en bâtiment
        plombier skip
        électricien skip
        chauffagiste
        frigoriste
        carreleur
        parquetiste skip
        vitrier
        serrurier
        forgeron
        soudeur
        métallurgiste skip
        mécanicien skip
        garagiste
        carrossier
        dépanneur
        informaticien skip
        programmeur
        développeur
        webmestre skip
        graphiste
        designer
        architecte skip
        urbaniste
        géomètre
        topographe skip
        ingénieur skip
        technicien
        ouvrier
        ouvrière
        contremaître
        chef d'équipe
        patron
        dirigeant
        entrepreneur
        artisan skip
        apprenti
        stagiaire
        étudiant
        étudiante
        collégien
        lycéen
        écolier skip
        écolière skip
        bébé skip
        enfant skip
        adolescent
        adulte
        senior skip
        retraité
        chômeur skip
        bénévole
        milicien skip
    """,
    "objet": """
        appareil antenne appareil photo appareil skip
        allumette skip
        ancre skip
        appareil skip
        aspirateur
        baladeur
        batterie
        bidon
        boîte skip
        bocal skip
        bougie skip
        bouteille skip
        brosse skip
        cadnas skip
        cadenas
        caisse
        calculatrice skip
        caméra
        canne
        capteur
        carte skip
        cartouche
        cassette
        ceintre skip
        cintre
        cadenas skip
        clavier skip
        clé skip
        clou skip
        coffre skip
        coffret
        collier skip
        combiné
        compact skip
        compteur
        console
        corbeille skip
        cordon
        couteau skip
        couvercle
        craie skip
        crayon skip
        cube skip
        cueillère skip
        cuillère skip
        dé skip
        disque
        dossier skip
        drapeau
        éclairage
        écran skip
        écrou skip
        élastique
        enveloppe
        étiquette
        éventail
        fer à repasser
        fiche skip
        filet skip
        film
        filtre
        flacon
        flash
        fleuret skip
        flute skip
        flûte
        fourchette skip
        gourde
        grattoir
        grille
        harmonica
        haut-parleur
        hélicoptère skip
        horloge skip
        instrument
        interrupteur skip
        jerrican skip
        jouet skip
        jug skip
        cruche
        lampadaire
        lampe skip
        lanterne
        lecteur
        lentille skip
        livre skip
        loupe skip
        machine
        marteau skip
        microphone
        micro-onde
        mixeur
        montre skip
        moule skip
        moulin
        mp3 skip
        musique skip
        objet
        outil
        paille
        palette skip
        panier skip
        papiers
        parapluie
        parasol
        peigne skip
        pelle
        pendentif
        perceuse skip
        piano
        pile
        pince skip
        pinceau skip
        pioche
        pipe skip
        pipette
        plaque
        plateau skip
        plume
        pneu
        poche skip
        poêle
        poignée
        pointe
        pompe
        portail
        porte-clés
        porte-monnaie
        poubelle skip
        prise skip
        projecteur
        radio skip
        rallonge skip
        râteau
        rayon skip
        récipient
        réveil skip
        robot
        roue
        sablier
        sac skip
        sacoche
        scie skip
        seau skip
        sécateur
        serre
        sifflet skip
        sonnette
        soufflet
        stylo skip
        tablette skip
        tampon
        tapis skip
        tasse
        téléphone skip
        télécommande
        thermomètre
        tirelire
        tournevis skip
        treillis skip
        trombone
        tube
        vase skip
        ventilateur skip
        vis skip
        visseuse skip
        voiture skip
        voltmètre skip
        wagon
        xylophone
        yo-yo
        zip skip
        fermeture
        fermeture Éclair
        zip skip
    """,
    "transport": """
        automobile skip
        auto
        berline
        break skip
        cabriolet
        camionnette
        car
        caravane
        chariot
        charrette
        métro
        tramway
        tram
        trolleybus
        autocar
        minibus
        taxi skip
        limousine skip
        fourgon
        fourgonnette
        benne
        citerne
        grue
        tracteur
        moissonneuse
        remorque
        semi-remorque
        train skip
        locomotive
        wagon skip
        wagon-lit
        TGV
        TER
        RER
        métro skip
        RATP skip
        SNCF skip
        quai skip
        voie skip
        rail
        aiguillage
        caténaire skip
        tunnel skip
        viaduc skip
        pont skip
        gare skip
        station skip
        arrêt skip
        terminus
        correspondance
        billet
        ticket
        abonnement
        composteur
        valideur
        tourniquet
        avion skip
        avionnette skip
        avion de ligne
        Airbus skip
        Boeing skip
        planeur
        ULM
        hélicoptère
        hydravion
        montgolfière
        dirigeable
        fusée skip
        satellite
        navette
        vaisseau
        station spatiale
        bateau skip
        navire
        paquebot
        ferry
        cargo
        pétrolier
        voilier
        yacht
        chalutier
        barque
        canoë skip
        kayak skip
        paddle skip
        pédalo
        jet-ski
        hors-bord
        péniche
        barge
        radeau
        sous-marin
        porte-avions
        frégate
        croiseur skip
        destroyer skip
        torpilleur skip
        vedette
        canot
        radeau skip
        gilet de sauvetage
        bouée
        ancre skip
        gouvernail
        hélice
        voile skip
        mât
        cordage
        poulie
        cabine
        pont skip
        cale
        hublot
        vigie skip
        capitaine skip
        équipage
        passager
        passagère
        voyageur
        voyageuse
        piéton
        cycliste
        motard
        chauffeur skip
        conducteur skip
        conductrice
        pilote skip
        copilote
        steward skip
        hôtesse skip
        aiguilleur skip
        contrôleur skip
        douanier skip
        bagage
        valise skip
        sac à dos
        coffre skip
        porte-bagages
        galerie skip
        attelage
        remorque skip
        caravane skip
        camping-car
        mobile-home skip
        roulotte
        calèche
        diligence skip
        chariot skip
        brouette
        caddie
        poussette
        landau
        trottinette skip
        roller skip
        skateboard
        gyropode skip
        hoverboard skip
        monocycle
        tricycle
        draisienne
        tandem
        vélo skip
        VTT skip
        vélo électrique
        scooter
        moto skip
        motocyclette
        side-car
        quad
        kart
        formule skip
        bolide
        dragster skip
        ambulance skip
        camion de pompiers
        fourgon skip
        fourgon cellulaire
        dépanneuse
        déneigeuse
        chasse-neige
        balayeuse
        benne skip
        camion-poubelle
        engins skip
        engin de chantier
        bulldozer
        pelleteuse
        niveleuse
        compacteur
        bétonnière
        malaxeur
        grue skip
        monte-charge
        ascenseur
        escalier mécanique
        tapis roulant
        téléphérique
        télésiège
        téléski
        funiculaire
        crémaillère skip
        transbordeur skip
        bac skip
        ferry skip
    """,
    "récit": """
        album anecdote aventure skip
        ballade skip
        bande skip
        bande dessinée skip
        biographie
        chanson
        chapitre skip
        personnage skip
        héros
        héroïne
        vilain
        ogre
        ogresse
        géant
        géante
        nain
        fée skip
        lutin
        gnome skip
        elfe
        troll
        dragon skip
        licorne
        phénix
        griffin skip
        griffon
        sirène
        centaure
        minotaure
        cyclope
        titan skip
        dieu
        déesse
        magicien skip
        magicienne
        sorcier skip
        sorcière skip
        enchanteur
        enchanteresse
        alchimiste
        druide
        oracle
        prophète
        chevalier skip
        chevalerie
        écuyer
        paladin skip
        prince skip
        princesse skip
        roi skip
        reine skip
        empereur
        impératrice
        duc
        duchesse
        comte
        comtesse
        baron
        baronne
        seigneur
        dame skip
        page skip
        troubadour
        ménestrel
        bouffon
        château skip
        donjon skip
        tour skip
        rempart skip
        pont-levis
        douves
        meurtrière
        créneau
        courtine skip
        donjon skip
        salle du trône
        trône
        couronne
        sceptre
        orbe skip
        épée
        bouclier
        armure
        heaume
        cotte
        lance
        hache
        masse
        arc skip
        flèche skip
        carquois skip
        catapulte
        trébuchet skip
        bélier
        siège skip
        bataille
        guerre
        paix
        traité
        alliance
        ennemi
        allié
        armée
        soldat skip
        guerrier
        amazone
        pirate skip
        corsaire
        boucanier
        capitaine skip
        moussaillon
        trésor skip
        carte skip
        coffre skip
        doubloon skip
        doublon
        perle
        diamant
        émeraude
        rubis
        saphir
        or
        argent skip
        bronze
        cuivre
        fer skip
        étain
        plomb
        acier
        cristal skip
        magie skip
        sort
        sortilège
        potion
        philtre
        baguette skip
        grimoire
        rituel
        enchantement
        malédiction
        bénédiction
        miracle
        légende
        mythe
        fable skip
        conte skip
        roman skip
        nouvelle skip
        poème skip
        poésie skip
        rime
        vers skip
        strophe
        refrain
        couplet
        chanson skip
        comptine
        berceuse
        hymne
        opéra skip
        ballet
        pièce
        comédie
        tragédie
        drame
        spectacle
        cirque skip
        numéro
        trapèze
        jongleur
        acrobate
        clown skip
        dompteur
        prestidigitateur skip
        illusionniste
        marionnette
        marionnettiste
        théâtre skip
        scène
        coulisse
        rideau skip
        décor
        costume skip
        maquillage
        projecteur skip
        projecteurs
        public
        applaudissement
        bis
        rappel
        succès
        échec skip
        critique
        chronique
        journal skip
        article
        reportage
        interview
        documentaire
        film skip
        cinéma skip
        séance
        écran skip
        pellicule
        caméra skip
        projection
        réalisateur skip
        acteur skip
        actrice skip
        figurant
        cascadeur skip
        cascade
        trucage
        dessin animé
        cartoon skip
        manga
        anime skip
        bande dessinée skip
        bulle
        onomatopée
        case
        planche
        album skip
        collection skip
        série
        tome
        volume skip
        édition
        imprimeur skip
        éditeur skip
        librairie skip
        bibliothèque skip
        lecture skip
        lecteur skip
        lectrice
        auteur skip
        autrice
        illustrateur skip
        illustratrice
        préface
        postface
        sommaire
        table des matières
        index
        glossaire
        dictionnaire skip
        encyclopédie
        atlas skip
        carte skip
        globe skip
        mappemonde skip
    """,
    "temps": """
        seconde skip
        seconde
        minute skip
        heure skip
        journée
        soirée
        matinée
        après-midi skip
        minuit skip
        midi skip
        aube
        crépuscule
        aurore
        coucher skip
        lever skip
        lever du soleil
        coucher du soleil
        équinoxe
        solstice
        trimestre skip
        semestre
        trimestre skip
        trimestre scolaire
        année skip
        année scolaire
        décennie
        siècle
        millénaire
        époque
        ère
        période
        instant
        moment skip
        durée
        délai
        retard
        avance skip
        ponctualité
        calendrier skip
        agenda
        almanach
        horloge skip
        montre skip
        chronomètre
        sablier skip
        cadran
        aiguille skip
        pendule
        carillon
        réveil skip
        minuterie
        minuteur
        minuteur skip
        timer skip
        fuseau skip
        fuseau horaire
        Greenwich skip
        midi skip
        fuseau skip
        décalage
        jet-lag skip
        vacances skip
        congé
        congés
        week-end
        week-end skip
        week end skip
        weekend skip
        férié
        jour férié
        pont skip
        pont du skip
        pont de mai
        Toussaint
        Noël skip
        Pâques skip
        Ascension
        Pentecôte
        Assomption
        14-Juillet
        11-Novembre
        8-Mai
        1er-Mai
        Nouvel An
        Saint-Nicolas
        Épiphanie
        Chandeleur
        Mardi gras
        mercredi des Cendres skip
        Carême
        Ramadan
        Aïd
        Hanoucca
        Pessah skip
        Yom Kippour skip
        Diwali skip
        Nouvel An chinois
        Halloween
        Saint-Valentin
        fête des Mères
        fête des Pères
        fête de la Musique
        carnaval skip
        kermesse skip
        foire
        marché de Noël
        réveillon
        réveillon skip
        réveillon de Noël
        réveillon du Jour de l'An
        galette
        galette des rois
        bûche
        bûche de Noël
        crèche skip
        sapin
        sapin de Noël
        boule skip
        guirlande
        lumignon
        lumignons
        calendrier de l'Avent
        Avent
        roi mage
        rois mages
        myrrhe
        encens skip
        or skip
        étoile skip
        étoile du berger
        crèche skip
    """,
    "qualité": """
        amitié amour bonté bravoure charité douceur skip
        honnêteté
        honneur
        humilité
        justice
        loyauté
        modestie
        patience skip
        politesse skip
        prudence
        respect
        sagesse
        solidarité
        tendresse
        tolérance
        volonté
        courage skip
        générosité
        gentillesse skip
        honnêteté skip
        intelligence
        mémoire
        imagination
        curiosité
        attention skip
        concentration
        persévérance
        motivation
        enthousiasme
        optimisme
        pessimisme skip
        espoir
        confiance
        fierté
        vanité skip
        orgueil
        jalousie
        envie
        colère skip
        rage
        haine
        rancune
        vengeance
        peur skip
        angoisse
        anxiété
        stress
        trac
        honte
        gêne
        embarras
        tristesse skip
        chagrin
        mélancolie
        déprime skip
        dépression skip
        solitude
        ennui
        lassitude
        fatigue
        épuisement
        sommeil skip
        énergie
        vitalité
        santé
        maladie
        blessure
        douleur
        souffrance
        soulagement
        plaisir
        joie skip
        bonheur skip
        allégresse
        extase skip
        rire skip
        sourire skip
        éclat de rire
        larme skip
        sanglot
        cri skip
        cri skip
        hurlement
        murmure
        chuchotement
        silence skip
        bruit skip
        tapage
        vacarme
        tintamarre
        mélodie
        rythme
        tempo skip
        harmonie
        dissonance skip
        fausse note
        accord skip
        gamme
        note skip
        partition
        orchestre skip
        chef d'orchestre
        soliste
        choriste
        chœur
        chorale skip
        soprano
        alto skip
        ténor
        basse skip
        piano skip
        violon
        alto skip
        violoncelle
        contrebasse
        harpe
        guitare
        ukulélé
        banjo
        mandoline
        flûte skip
        flûte traversière
        flûte à bec
        piccolo
        hautbois
        clarinette
        saxophone
        basson
        trompette
        cor
        trombone
        tuba
        bugle
        cornet
        harmonica skip
        accordéon
        orgue
        clavecin
        synthétiseur
        batterie skip
        tambour
        caisse claire
        grosse caisse
        cymbale
        triangle skip
        xylophone skip
        marimba
        vibraphone
        timbale
        djembé
        bongo
        conga
        tambourin
        maracas
        castagnettes
        grelot
        clochette
        carillon skip
        diapason
        pupitre
        pupitre skip
        pupitre de musique
        pupitre skip
        pupitre skip
        pupitre skip
        pupitre skip
        pupitre skip
        pupitre skip
    """,
    "nom": """
        affaire aide air skip
        endroit côté cas skip
        exemple skip
        état guerre skip
        paix skip
        loi droit argent prix groupe skip
        problème skip
        société système programme information service besoin raison effet
        ordre type niveau projet rapport recherche action skip
        résultat skip
        force skip
        forme skip
        valeur intérêt rôle but moyen skip
        place skip
        point skip
        ligne skip
        fait skip
        fois skip
        manière sorte espèce genre skip
        qualité skip
        quantité différence changement mouvement situation condition
        relation skip
        décision solution skip
        explication description conversation discussion réunion rencontre
        visite skip
        départ arrivée retour entrée sortie début fin milieu centre bord
        fond surface intérieur extérieur gauche droite arrière dessus dessous
        autour chose personne skip
        idée vie skip
        homme femme skip
        travail skip
        question skip
        partie skip
        gouvernement skip
        gouvernement
        nation
        pays skip
        région
        département
        commune
        canton
        arrondissement
        quartier skip
        continent
        Europe
        Afrique
        Asie
        Amérique
        Océanie
        Antarctique
        France
        Belgique
        Suisse
        Canada
        Espagne
        Italie
        Allemagne
        Portugal
        Angleterre
        Irlande
        Écosse
        Pays de Galles
        Grèce
        Turquie
        Russie
        Chine
        Japon
        Inde
        Brésil
        Mexique
        Argentine
        Chili
        Pérou
        Égypte
        Maroc
        Algérie
        Tunisie
        Sénégal
        Mali
        Côte d'Ivoire
        Cameroun
        Madagascar
        Australie
        Nouvelle-Zélande
        Paris
        Lyon
        Marseille
        Toulouse
        Lille
        Bordeaux
        Nantes
        Strasbourg
        Montpellier
        Rennes
        Grenoble
        Nice
        Toulon
        Reims
        Saint-Étienne
        Le Havre
        Dijon
        Angers
        Villeurbanne
        Nîmes
        Clermont-Ferrand
        Le Mans
        Aix-en-Provence
        Brest
        Tours
        Amiens
        Limoges
        Annecy
        Perpignan
        Metz
        Besançon
        Orléans
        Rouen
        Mulhouse
        Caen
        Nancy
        Argenteuil
        Montreuil
        Saint-Denis
        Versailles
        Avignon
        Poitiers
        La Rochelle
        Bayonne
        Biarritz
        Cannes
        Antibes
        Ajaccio
        Bastia
        Fort-de-France
        Pointe-à-Pitre
        Saint-Denis de La Réunion
        mer Méditerranée
        mer du Nord
        océan Atlantique
        océan Pacifique
        océan Indien
        mer Rouge
        mer Noire
        mer Baltique
        Manche
        mer du skip
        Garonne
        Loire
        Seine
        Rhône
        Rhin
        Danube
        Nil
        Amazone
        Mississippi
        Yangtsé skip
        Gange
        Volga
        Tamise
        Tage
        Ebre skip
        Pô
        Tibre
        Elbe
        Vistule
        Dniepr skip
        Alpes
        Pyrénées
        Massif central
        Jura
        Vosges
        Armorique skip
        Bretagne
        Normandie
        Provence
        Corse
        Alsace
        Lorraine
        Champagne
        Bourgogne
        Auvergne
        Limousin
        Aquitaine
        Gascogne
        Languedoc
        Roussillon
        Savoie
        Dauphiné
        Anjou
        Touraine
        Poitou
        Charente
        Vendée
        Maine
        Picardie
        Artois
        Flandre
        Ardennes
        Franche-Comté
        Île-de-France
        Mont-Blanc
        Mont Ventoux
        Puy de Dôme
        Pic du Midi
        Canigou
        Ballon d'Alsace
        Tour Eiffel
        Arc de Triomphe
        Notre-Dame
        Sacré-Cœur
        Louvre
        Versailles skip
        Mont-Saint-Michel
        château de Chambord
        château de Chenonceau
        pont du Gard
        arènes de Nîmes
        palais des Papes
        cité de Carcassonne
        grotte de Lascaux
        grotte de Chauvet
        cascade skip
        Niagara
        Grand Canyon
        Kilimandjaro
        Everest
        Himalaya
        Andes
        Rocheuses
        Sahara
        Gobi
        Amazonie
        Antarctique skip
        Arctique
        pôle Nord
        pôle Sud
        équateur
        tropique
        tropique du Cancer
        tropique du Capricorne
        méridien
        parallèle
        latitude
        longitude
        altitude
        profondeur
        distance
        kilomètre
        mètre skip
        centimètre
        millimètre
        gramme
        kilogramme
        tonne
        litre
        centilitre
        millilitre
        degré
        Celsius
        Fahrenheit skip
        Kelvin skip
        euro
        dollar
        livre skip
        yen
        yuan skip
        franc skip
        centime
        pièce skip
        billet skip
        monnaie
        banque skip
        compte skip
        chèque
        carte skip
        carte bancaire
        paiement
        achat
        vente
        prix skip
        coût
        tarif
        réduction
        solde
        solde skip
        soldes
        promotion
        publicité
        affiche
        panneau skip
        enseigne
        vitrine
        rayon skip
        étalage
        caisse skip
        ticket skip
        ticket de caisse
        sac skip
        sac plastique
        sac en papier
        cabas
        caddie skip
        chariot skip
        filet skip
        filet à provisions
        liste skip
        liste de courses
        courses
        courses skip
        commission
        commissions
        marché skip
        foire skip
        brocante
        vide-grenier
        braderie
        kermesse skip
        tombola
        loterie
        loto skip
        chance
        malchance
        hasard
        destin
        destinée
        avenir
        passé skip
        présent skip
        futur skip
        souvenir
        souvenir skip
        mémoire skip
        oubli
        souvenir skip
        photo skip
        photographie
        cliché
        album skip
        cadre skip
        cadre photo skip
        portrait
        paysage skip
        nature morte
        gravure
        dessin skip
        croquis
        esquisse
        aquarelle
        pastel
        fusain
        encre skip
        pinceau skip
        palette skip
        toile
        chevalet
        atelier skip
        musée skip
        galerie skip
        exposition
        vernissage
        collection skip
        collectionneur
        antiquaire
        brocanteur
        commissaire-priseur skip
        enchère
        enchères
        trésor skip
        fortune
        richesse
        pauvreté
        misère
        luxe
        simplicité
        élégance
        mode
        tendance
        style
        goût
        dégoût
        odeur
        parfum
        senteur
        fragrance skip
        arôme
        fumet
        relent skip
        puanteur
        fraîcheur
        chaleur
        tiédeur
        froid skip
        gel
        gelée
        givre skip
        glace skip
        neige skip
        grêle skip
        pluie skip
        averse skip
        ondée
        bruine
        brouillard skip
        brume
        nuage skip
        cumulus
        nimbus
        cirrus
        stratus skip
        orage skip
        éclair skip
        tonnerre skip
        foudre
        arc-en-ciel skip
        halo
        aurore boréale
        étoile skip
        planète skip
        satellite skip
        comète
        astéroïde
        météorite
        galaxie
        univers
        cosmos
        nébuleuse
        trou noir
        supernova skip
        Soleil skip
        Lune skip
        Terre skip
        Mercure
        Vénus
        Mars
        Jupiter
        Saturne
        Uranus
        Neptune
        Pluton
        satellite skip
        Lune skip
        Phobos skip
        Titan skip
        Europe skip
        Io
        Ganymède
        Callisto
        Triton skip
        Charon skip
        halo skip
    """,
}

# Mots anglais / erreurs à exclure
DENY = {
    "skip", "cartoon", "anime", "manga", "hoodie", "overall", "running", "snow",
    "snowboot", "soccer", "dunk", "timer", "weekend", "week", "end", "jet-lag",
    "Greenwich", "Fahrenheit", "Kelvin", "yuan", "dragster", "hoverboard",
    "gyropode", "mobile-home", "destroyer", "torpilleur", "Boeing", "Airbus",
    "RATP", "SNCF", "TER", "TGV", "RER", "starting-block", "softball",
    "skeleton", "ball-trap", "putting", "green", "tee", "club", "catch",
    "kickboxing", "recordman", "barista", "webmestre", "parquetiste",
    "métallurgiste", "océanographe", "orthodontiste", "ostéopathe",
    "prestidigitateur", "commissaire-priseur", "fragrance", "supernova",
    "Phobos", "Charon", "stratus", "meseta", "hamada", "palétuvier",
    "aquifère", "cataracte", "péroné", "métacarpe", "métatarse", "ménisque",
    "diaphragme", "pharynx", "cochlée", "cristallin", "fontanelle", "rectum",
    "uretère", "vésicule", "plasma", "plaque", "valve", "acné", "diabète",
    "mucus", "bile", "cuissarde", "escarpin", "richelieu", "derbies",
    "smoking", "body", "ceintre", "cadnas", "cueillère", "jug", "flute",
    "zip", "voltmètre", "mp3", "compact", "antenne", "appareil",
    "doubloon", "griffin", "gnome", "paladin", "orbe", "trébuchet",
    "courtine", "titan", "ballade", "anecdote", "cafeteria", "cathedral",
    "girafeau", "truies", "hamac", "choucroute", "chocolatine", "daube",
    "pot-au-feu", "yaourt à boire", "brioche sucrée", "pain au chocolat",
    "sirop d'érable", "eau minérale", "jus", "soda", "candélabre",
    "jerrican", "soffite", "vide-ordures", "dessous-de-plat", "velux",
    "AESH", "CDI", "crayon-feutre", "canson", "bristol", "graphe",
    "mercredi des Cendres", "pont du", "pont de mai", "Saint-Denis de La Réunion",
    "mer du", "Yangtsé", "Ebre", "Dniepr", "Armorique", "14-Juillet",
    "11-Novembre", "8-Mai", "1er-Mai", "Pays de Galles", "Côte d'Ivoire",
    "Pointe-à-Pitre", "Fort-de-France", "Aix-en-Provence", "Clermont-Ferrand",
    "fermeture Éclair", "yo-yo", "fer à repasser", "micro-onde",
    "porte-clés", "porte-monnaie", "appareil photo", "caserne de pompiers",
    "cabinet médical", "jardin public", "palais des sports", "fête foraine",
    "passage piéton", "feu tricolore", "panneau stop", "piste cyclable",
    "station de métro", "arrêt de bus", "station-service", "caserne de pompiers",
    "garde de la paix", "gardien de la paix", "sapeur-pompier",
    "maître-nageur", "hôtesse de l'air", "chauffeur de bus", "agent d'entretien",
    "garde forestier", "garde champêtre", "garde-chasse", "professeur de sport",
    "metteur en scène", "peintre en bâtiment", "chef d'équipe", "expert-comptable",
    "colonne vertébrale", "fosses nasales", "dos crawlé", "nage libre",
    "flûte traversière", "flûte à bec", "caisse claire", "grosse caisse",
    "chef d'orchestre", "pupitre de musique", "jeu de dames", "tennis de table",
    "tir à l'arc", "stand de tir", "hockey sur glace", "patinage artistique",
    "danse sur glace", "ski alpin", "ski de fond", "saut à ski", "planche à voile",
    "maillot jaune", "carton jaune", "carton rouge", "avant-centre",
    "gilet de sauvetage", "avion de ligne", "wagon-lit", "vélo électrique",
    "camion de pompiers", "fourgon cellulaire", "engin de chantier",
    "escalier mécanique", "tapis roulant", "bande dessinée", "salle du trône",
    "pont-levis", "nœud papillon", "chemise de nuit", "robe de chambre",
    "robe de soirée", "boucle d'oreille", "cahier de textes", "crayon de couleur",
    "pâte à modeler", "cour de récréation", "sortie scolaire", "fromage blanc",
    "petit-pois", "pain d'épices", "raton laveur", "mer Méditerranée",
    "mer du Nord", "océan Atlantique", "océan Pacifique", "océan Indien",
    "mer Rouge", "mer Noire", "mer Baltique", "pôle Nord", "pôle Sud",
    "tropique du Cancer", "tropique du Capricorne", "carte bancaire",
    "ticket de caisse", "sac plastique", "sac en papier", "filet à provisions",
    "liste de courses", "cadre photo", "nature morte", "aurore boréale",
    "trou noir", "calendrier de l'Avent", "étoile du berger", "galette des rois",
    "bûche de Noël", "sapin de Noël", "réveillon de Noël",
    "réveillon du Jour de l'An", "fête des Mères", "fête des Pères",
    "fête de la Musique", "Nouvel An", "Nouvel An chinois", "roi mage",
    "rois mages", "jour férié", "fuseau horaire", "année scolaire",
    "trimestre scolaire", "lever du soleil", "coucher du soleil",
    "éclat de rire", "fausse note", "Massif central", "Île-de-France",
    "Mont-Blanc", "Mont Ventoux", "Puy de Dôme", "Pic du Midi",
    "Ballon d'Alsace", "Tour Eiffel", "Arc de Triomphe", "Sacré-Cœur",
    "Mont-Saint-Michel", "château de Chambord", "château de Chenonceau",
    "pont du Gard", "arènes de Nîmes", "palais des Papes", "cité de Carcassonne",
    "grotte de Lascaux", "grotte de Chauvet", "Grand Canyon", "Saint-Étienne",
    "Le Havre", "Le Mans", "Notre-Dame",
    "Cendres", "Yom", "Kippour", "Galles", "Mères", "Pères", "Havre", "Mans",
    "Rochelle", "Massif", "Mont", "Ventoux", "Puy", "Dôme", "Pic", "Eiffel",
    "Triomphe", "Papes", "Sud", "Nord", "Cancer", "Capricorne", "Ganymède",
    "Callisto", "Triton", "Indien", "sur", "Yom Kippour",
}

CLOSED = {
    "sur", "dans", "sous", "avec", "sans", "pour", "par", "chez", "vers",
    "entre", "parmi", "selon", "durant", "malgré", "sauf", "hormis",
}

ADJ_EXTRA = [
    ("sale", "sale"),
    ("riche", "riche"),
    ("pauvre", "pauvre"),
    ("sage", "sage"),
    ("méchant", "méchante"),
    ("intelligent", "intelligente"),
    ("bête", "bête"),
    ("mince", "mince"),
    ("épais", "épaisse"),
    ("large", "large"),
    ("étroit", "étroite"),
    ("profond", "profonde"),
    ("vide", "vide"),
    ("plein", "pleine"),
    ("ouvert", "ouverte"),
    ("fermé", "fermée"),
    ("cassé", "cassée"),
    ("mouillé", "mouillée"),
    ("sec", "sèche"),
    ("ancien", "ancienne"),
    ("moderne", "moderne"),
    ("célèbre", "célèbre"),
    ("inconnu", "inconnue"),
    ("possible", "possible"),
    ("impossible", "impossible"),
    ("nécessaire", "nécessaire"),
    ("inutile", "inutile"),
    ("utile", "utile"),
    ("capable", "capable"),
    ("fatigué", "fatiguée"),
    ("malade", "malade"),
    ("vivant", "vivante"),
    ("mort", "morte"),
    ("libre", "libre"),
    ("occupé", "occupée"),
    ("pareil", "pareille"),
    ("unique", "unique"),
    ("nombreux", "nombreuse"),
    ("rare", "rare"),
    ("extraordinaire", "extraordinaire"),
    ("ordinaire", "ordinaire"),
    ("spécial", "spéciale"),
    ("normal", "normale"),
    ("étrange", "étrange"),
    ("bizarre", "bizarre"),
    ("amusant", "amusante"),
    ("ennuyeux", "ennuyeuse"),
    ("intéressant", "intéressante"),
    ("prudent", "prudente"),
    ("honnête", "honnête"),
    ("fidèle", "fidèle"),
    ("public", "publique"),
    ("privé", "privée"),
    ("supérieur", "supérieure"),
    ("inférieur", "inférieure"),
    ("prochain", "prochaine"),
    ("suivant", "suivante"),
    ("précédent", "précédente"),
    ("présent", "présente"),
    ("absent", "absente"),
    ("certain", "certaine"),
    ("sûr", "sûre"),
    ("vrai", "vraie"),
    ("juste", "juste"),
    ("injuste", "injuste"),
    ("égal", "égale"),
    ("entier", "entière"),
    ("simple", "simple"),
    ("compliqué", "compliquée"),
    ("clair", "claire"),
    ("obscur", "obscure"),
    ("lumineux", "lumineuse"),
    ("bruyant", "bruyante"),
    ("silencieux", "silencieuse"),
    ("agréable", "agréable"),
    ("désagréable", "désagréable"),
    ("délicat", "délicate"),
    ("solide", "solide"),
    ("fragile", "fragile"),
    ("résistant", "résistante"),
    ("souple", "souple"),
    ("dur", "dure"),
    ("mou", "molle"),
    ("tendre", "tendre"),
    ("amer", "amère"),
    ("acide", "acide"),
    ("doux", "douce"),
    ("piquant", "piquante"),
    ("parfumé", "parfumée"),
    ("fade", "fade"),
    ("glissant", "glissante"),
    ("collant", "collante"),
    ("lisse", "lisse"),
    ("rugueux", "rugueuse"),
    ("doux", "douce"),
    ("velu", "velue"),
    ("nu", "nue"),
    ("habillé", "habillée"),
    ("coiffé", "coiffée"),
    ("propre", "propre"),
    ("sale", "sale"),
    ("net", "nette"),
    ("sale", "sale"),
    (" ordonné", "ordonnée"),
    ("désordonné", "désordonnée"),
    ("rangé", "rangée"),
    ("en retard", "en retard"),
    ("en avance", "en avance"),
    ("à l'heure", "à l'heure"),
    ("prêt", "prête"),
    ("fini", "finie"),
    ("commencé", "commencée"),
    ("terminé", "terminée"),
    ("réussi", "réussie"),
    ("raté", "ratée"),
    ("gagnant", "gagnante"),
    ("perdant", "perdante"),
    ("vainqueur", "vainqueur"),
    ("champion", "championne"),
    ("local", "locale"),
    ("national", "nationale"),
    ("mondial", "mondiale"),
    ("international", "internationale"),
    ("principal", "principale"),
    ("secondaire", "secondaire"),
    ("essentiel", "essentielle"),
    ("accessoire", "accessoire"),
    ("général", "générale"),
    ("particulier", "particulière"),
    ("personnel", "personnelle"),
    ("commun", "commune"),
    ("seul", "seule"),
    ("ensemble", "ensemble"),
    ("séparé", "séparée"),
    ("réuni", "réunie"),
    ("proche", "proche"),
    ("lointain", "lointaine"),
    ("voisin", "voisine"),
    ("éloigné", "éloignée"),
    ("central", "centrale"),
    ("latéral", "latérale"),
    ("droit", "droite"),
    ("gauche", "gauche"),
    ("haut", "haute"),
    ("bas", "basse"),
    ("moyen", "moyenne"),
    ("énorme", "énorme"),
    ("minuscule", "minuscule"),
    ("gigantesque", "gigantesque"),
    ("immense", "immense"),
    ("étroit", "étroite"),
    ("spacieux", "spacieuse"),
    ("confortable", "confortable"),
    ("inconfortable", "inconfortable"),
    ("pratique", "pratique"),
    ("commode", "commode"),
    ("efficace", "efficace"),
    ("rapide", "rapide"),
    ("lent", "lente"),
    ("soudain", "soudaine"),
    ("progressif", "progressive"),
    ("régulier", "régulière"),
    ("irrégulier", "irrégulière"),
    ("constant", "constante"),
    ("variable", "variable"),
    ("fixe", "fixe"),
    ("mobile", "mobile"),
    ("stable", "stable"),
    ("instable", "instable"),
    ("calme", "calme"),
    ("agité", "agitée"),
    ("nerveux", "nerveuse"),
    ("tranquille", "tranquille"),
    ("paisible", "paisible"),
    ("violent", "violente"),
    ("doux", "douce"),
    ("tendre", "tendre"),
    ("cruel", "cruelle"),
    ("gentil", "gentille"),
    ("aimable", "aimable"),
    ("sympathique", "sympathique"),
    ("antipathique", "antipathique"),
    ("agréable", "agréable"),
    ("charmant", "charmante"),
    ("séduisant", "séduisante"),
    ("laid", "laide"),
    ("moche", "moche"),
    ("beau", "belle"),
    ("joli", "jolie"),
    ("élégant", "élégante"),
    ("chic", "chic"),
    ("modeste", "modeste"),
    ("simple", "simple"),
    ("luxueux", "luxueuse"),
    ("pauvre", "pauvre"),
    ("riche", "riche"),
    ("cher", "chère"),
    ("bon marché", "bon marché"),
    ("gratuit", "gratuite"),
    ("payant", "payante"),
    ("obligatoire", "obligatoire"),
    ("facultatif", "facultative"),
    ("interdit", "interdite"),
    ("autorisé", "autorisée"),
    ("permis", "permise"),
    ("défendu", "défendue"),
    ("possible", "possible"),
    ("impossible", "impossible"),
    ("probable", "probable"),
    ("incertain", "incertaine"),
    ("évident", "évidente"),
    ("clair", "claire"),
    ("obscur", "obscure"),
    ("secret", "secrète"),
    ("connu", "connue"),
    ("ignoré", "ignorée"),
    ("célèbre", "célèbre"),
    ("inconnu", "inconnue"),
    ("populaire", "populaire"),
    ("rare", "rare"),
    ("fréquent", "fréquente"),
    ("habituel", "habituelle"),
    ("inhabituel", "inhabituelle"),
    ("extraordinaire", "extraordinaire"),
    ("remarquable", "remarquable"),
    ("ordinaire", "ordinaire"),
    ("banal", "banale"),
    ("original", "originale"),
    ("créatif", "créative"),
    ("inventif", "inventive"),
    ("imaginatif", "imaginative"),
    ("rêveur", "rêveuse"),
    ("réaliste", "réaliste"),
    ("idéal", "idéale"),
    ("parfait", "parfaite"),
    ("imparfait", "imparfaite"),
    ("excellent", "excellente"),
    ("mauvais", "mauvaise"),
    ("médiocre", "médiocre"),
    ("nul", "nulle"),
    ("super", "super"),
    ("formidable", "formidable"),
    ("génial", "géniale"),
    ("terrible", "terrible"),
    ("affreux", "affreuse"),
    ("horrible", "horrible"),
    ("épouvantable", "épouvantable"),
    ("merveilleux", "merveilleuse"),
    ("fantastique", "fantastique"),
    ("magique", "magique"),
    ("mystérieux", "mystérieuse"),
    ("étrange", "étrange"),
    ("curieux", "curieuse"),
    ("surpris", "surprise"),
    ("étonné", "étonnée"),
    ("ému", "émue"),
    ("touché", "touchée"),
    ("blessé", "blessée"),
    ("soigné", "soignée"),
    ("guéri", "guérie"),
    ("malade", "malade"),
    ("sain", "saine"),
    ("fort", "forte"),
    ("faible", "faible"),
    ("robuste", "robuste"),
    ("fragile", "fragile"),
    ("athlétique", "athlétique"),
    ("sportif", "sportive"),
    ("actif", "active"),
    ("passif", "passive"),
    ("dynamique", "dynamique"),
    ("paresseux", "paresseuse"),
    ("travailleur", "travailleuse"),
    ("appliqué", "appliquée"),
    ("sérieux", "sérieuse"),
    ("drôle", "drôle"),
    ("amusant", "amusante"),
    ("comique", "comique"),
    ("triste", "triste"),
    ("joyeux", "joyeuse"),
    ("heureux", "heureuse"),
    ("malheureux", "malheureuse"),
    ("content", "contente"),
    ("mécontent", "mécontente"),
    ("satisfait", "satisfaite"),
    ("ravi", "ravie"),
    ("furieux", "furieuse"),
    ("fâché", "fâchée"),
    ("en colère", "en colère"),
    ("calme", "calme"),
    ("patient", "patiente"),
    ("impatient", "impatiente"),
    ("poli", "polie"),
    ("impoli", "impolie"),
    ("rude", "rude"),
    ("doux", "douce"),
    ("aimable", "aimable"),
    ("aimant", "aimante"),
    ("tendre", "tendre"),
    ("affectueux", "affectueuse"),
    ("froid", "froide"),
    ("chaleureux", "chaleureuse"),
    ("accueillant", "accueillante"),
    ("hospitalier", "hospitalière"),
    ("généreux", "généreuse"),
    ("avare", "avare"),
    ("égoïste", "égoïste"),
    ("altruiste", "altruiste"),
    ("partageur", "partageuse"),
    ("solidaire", "solidaire"),
    ("juste", "juste"),
    ("loyal", "loyale"),
    ("fidèle", "fidèle"),
    ("traître", "traître"),
    ("sincère", "sincère"),
    ("hypocrite", "hypocrite"),
    ("franc", "franche"),
    ("discret", "discrète"),
    ("bavard", "bavarde"),
    ("silencieux", "silencieuse"),
    ("timide", "timide"),
    ("audacieux", "audacieuse"),
    ("courageux", "courageuse"),
    ("lâche", "lâche"),
    ("peureux", "peureuse"),
    ("craintif", "craintive"),
    ("brave", "brave"),
    ("héroïque", "héroïque"),
    ("prudent", "prudente"),
    ("imprudent", "imprudente"),
    ("sage", "sage"),
    ("fou", "folle"),
    ("insensé", "insensée"),
    ("raisonnable", "raisonnable"),
    ("logique", "logique"),
    ("absurde", "absurde"),
    ("intelligent", "intelligente"),
    ("stupide", "stupide"),
    ("bête", "bête"),
    ("malin", "maligne"),
    ("rusé", "rusée"),
    ("naïf", "naïve"),
    ("crédule", "crédule"),
    ("méfiant", "méfiante"),
    ("confiant", "confiante"),
    ("sûr", "sûre"),
    ("incertain", "incertaine"),
    ("hésitant", "hésitante"),
    ("décidé", "décidée"),
    ("déterminé", "déterminée"),
    ("volontaire", "volontaire"),
    ("têtu", "têtue"),
    ("obstiné", "obstinée"),
    ("souple", "souple"),
    ("rigide", "rigide"),
    ("flexible", "flexible"),
    ("ferme", "ferme"),
    ("doux", "douce"),
]

ER_EXTRA = [
    "danser", "inventer", "imaginer", "observer", "inviter", "décorer",
    "organiser", "présenter", "ramasser", "rapporter", "cacher", "casser",
    "laisser", "vider", "garder", "bricoler", "cuisiner", "jardiner",
    "patiner", "téléphoner", "collectionner", "photographier", "fabriquer",
    "réparer", "construire", "inventorier", "comparer", "classer",
    "numéroter", "entourer", "souligner", "barrer", "cocher", "relier",
    "décider", "choisir", "rester", "tomber", "garder", "former",
    "transformer", "informer", "réformer", "confirmer", "affirmer",
    "admirer", "adorer", "détester", "apprécier", "respecter", "tolérer",
    "supporter", "accepter", "refuser", "proposer", "imposer", "composer",
    "reposer", "déposer", "supposer", "exposer", "opposer", "poser",
    "arroser", "vaporiser", "utiliser", "réaliser", "analyser", "réviser",
    "réviser", "diviser", "multiplier", "additionner", "soustraire",
    "calculer", "résoudre", "prouver", "trouver", "retrouver", "prouver",
    "sauver", "saluer", "assurer", "mesurer", "assurer", "rassurer",
    "blesser", "soigner", "guérir", "tousser", "éternuer", "bailler",
    "bâiller", "soupirer", "respirer", "souffler", "siffler", "chuchoter",
    "murmurer", "hurler", "gémir", "pleurer", "sanglotter", "éclater",
    "exploser", "briller", "luire", "éclairer", "obscurcir", "assombrir",
    "éclaircir", "nettoyer", "salir", "tacher", "laver", "rincer",
    "essuyer", "sécher", "mouiller", "tremper", "plonger", "nager",
    "flotter", "couler", "inonder", "arroser", "planter", "semer",
    "récolter", "cueillir", "ramasser", "trier", "emballer", "déballer",
    "ouvrir", "fermer", "verrouiller", "déverrouiller", "accrocher",
    "décrocher", "attacher", "détacher", "nouer", "dénouer", "plier",
    "déplier", "enrouler", "dérouler", "tordre", "détordre", "casser",
    "réparer", "coller", "décoller", "scotcher", "agrafer", "perforer",
    "percer", "trou er",
]

# Verbes qui ne sont PAS en -er régulier : à retirer
ER_DENY = {
    "choisir", "soustraire", "résoudre", "guérir", "gémir", "luire",
    "obscurcir", "assombrir", "éclaircir", "cueillir", "ouvrir",
    "tordre", "détordre", "nettoyer", "essuyer", "semer", "nager",
    "plonger", "rester", "tomber", "poser", "laver", "utiliser",
    "mesurer", "trouver", "apprécier", "détester", "construire",
    "inventorier", "soustraire", "trou er", "bailler", "bâiller",
    "sanglotter", "scotcher", "agrafer", "perforer", "verrouiller",
    "déverrouiller", "décrocher", "dénouer", "déplier", "enrouler",
    "dérouler", "décoller", "réformer", "inventorier", "numéroter",
    "tolérer",  # é accent, handled separately maybe skip
    "photographier", "collectionner",  # ok actually regular
}

# Keep only clearly regular -er CE2 verbs not already in ER
ER_KEEP = [
    "danser", "inventer", "imaginer", "observer", "inviter", "décorer",
    "organiser", "présenter", "ramasser", "rapporter", "cacher", "casser",
    "laisser", "vider", "garder", "bricoler", "cuisiner", "jardiner",
    "patiner", "téléphoner", "fabriquer", "réparer", "comparer", "classer",
    "entourer", "souligner", "barrer", "cocher", "relier", "décider",
    "former", "transformer", "informer", "confirmer", "affirmer",
    "admirer", "adorer", "respecter", "supporter", "accepter", "refuser",
    "proposer", "imposer", "composer", "reposer", "déposer", "supposer",
    "exposer", "opposer", "arroser", "réaliser", "analyser", "réviser",
    "diviser", "multiplier", "additionner", "calculer", "prouver",
    "retrouver", "sauver", "saluer", "assurer", "rassurer", "blesser",
    "soigner", "tousser", "éternuer", "soupirer", "respirer", "souffler",
    "siffler", "chuchoter", "murmurer", "hurler", "pleurer", "éclater",
    "exploser", "briller", "éclairer", "salir", "tacher", "rincer",
    "sécher", "mouiller", "tremper", "flotter", "couler", "inonder",
    "planter", "récolter", "trier", "emballer", "déballer", "fermer",
    "accrocher", "attacher", "détacher", "nouer", "coller", "percer",
    "collectionner", "photographier", "grimper", "descendre",
    "traverser", "circuler", "stationner", "garer", "freiner", "klaxonner",
    "reculer", "tourner", "pivoter", "basculer", "renverser", "verser",
    "remplir", "vider", "goûter", "déguster", "savourer", "avaler",
    "mâcher", "croquer", "grignoter", "picorer", "becqueter",
    "nourrir", "abreuver", "allumer", "éteindre",
]


def no_accent(s: str) -> str:
    s = s.replace("œ", "oe").replace("Œ", "Oe").replace("æ", "ae")
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def faults(word: str) -> list[str]:
    out: list[str] = []

    def add(w: str | None) -> None:
        if not w:
            return
        w = w.strip()
        if w and w != word and w not in out:
            out.append(w)

    add(no_accent(word))
    m = re.search(r"(.)\1", word)
    if m:
        i = m.start()
        add(word[:i] + word[i + 1 :])
    else:
        for i, c in enumerate(word):
            if c.lower() in "bcdfghjklmnpqrstvwxz" and i > 0:
                add(word[: i] + c + word[i:])
                break
    if word.endswith("é"):
        add(word[:-1] + "er")
        add(word[:-1] + "ée")
    if "ph" in word:
        add(word.replace("ph", "f", 1))
    if "qu" in word:
        add(word.replace("qu", "k", 1))
    if word.endswith("eau"):
        add(word[:-3] + "o")
        add(word + "d")
    if word.endswith("aux"):
        add(word[:-3] + "als")
        add(word[:-1] + "s")
    if "tion" in word:
        add(word.replace("tion", "sion", 1))
        add(word.replace("tion", "cion", 1))
    if "ain" in word:
        add(word.replace("ain", "in", 1))
    if word.endswith("er") and len(word) > 3:
        add(word[:-2] + "é")
    if "è" in word:
        add(word.replace("è", "é", 1))
    if "ê" in word:
        add(word.replace("ê", "ai", 1))
    if "ç" in word:
        add(word.replace("ç", "c", 1))
        add(word.replace("ç", "ss", 1))
    if "ss" in word:
        add(word.replace("ss", "s", 1))
    if "gn" in word:
        add(word.replace("gn", "ni", 1))
    if "ill" in word:
        add(word.replace("ill", "y", 1))
    if "eau" in word and not word.endswith("eau"):
        add(word.replace("eau", "o", 1))
    if word.endswith("e") and len(word) > 4:
        add(word[:-1])
    elif len(word) > 3:
        add(word + "e")
        add(word[:-1])
    if len(out) < 2:
        add(word + "e")
        add(word + "t")
        if "e" in word:
            add(word.replace("e", "é", 1))
    return out[:3]


def tokenize_group(blob: str) -> list[str]:
    # Keep hyphenated / apostrophe tokens; drop skip
    parts = re.split(r"\s+", blob.strip())
    out = []
    for p in parts:
        p = p.strip()
        if not p or p.lower() == "skip":
            continue
        out.append(p)
    return out


def existing_words(text: str) -> set[str]:
    found = set()
    for name in ("LEX", "MORE"):
        m = re.search(rf"const {name} = \[(.*?)\n\];", text, re.S)
        if not m:
            continue
        for t in re.findall(r'\n  \["([^"]+)"', m.group(1)):
            found.add(t.casefold())
    for t in re.findall(r'\["([^"]+)",\s*"([^"]+)"', text):
        found.add(t[0].casefold())
        found.add(t[1].casefold())
    return found


def is_ok_word(w: str) -> bool:
    if w in DENY or w.casefold() in {d.casefold() for d in DENY}:
        return False
    if "skip" in w.casefold():
        return False
    if any(ch.isdigit() for ch in w) and not re.match(r"^\d", w):
        # years like 14-Juillet ok
        pass
    if len(w) < 3:
        return False
    if w[:1].isupper():
        return False
    if re.match(r"^(d'|l'|n'|s'|m'|c'|j'|t'|qu')", w, re.I) and w not in {"presqu'île"}:
        return False
    if w[:1].islower() and ("'" in w or "’" in w) and w not in {"presqu'île"}:
        return False
    if w.endswith(" skip"):
        return False
    # reject leftover English-looking tokens
    if re.fullmatch(r"[A-Za-z\-']+", no_accent(w)) and w.casefold() in {
        "end", "club", "green", "tee", "catch", "timer", "weekend", "cartoon",
        "anime", "manga", "hoodie", "overall", "running", "snow", "soccer",
        "dunk", "body", "zip", "compact", "golf", "poker", "bingo", "monopoly",
        "puzzle", "loto", "cross", "footing", "jogging", "sprint", "relay",
        "marathon", "penalty", "corner", "carton", "smash", "service",
        "dribble", "rebond", "bowling", "cricket", "baseball", "softball",
        "hockey", "golf", "yoga", "judo", "karaté", "kayak", "surf", "ski",
        "rugby", "tennis", "box", "boxe", "canoë", "parachute",
    }:
        # keep real French loanwords used in CE2: yoga judo rugby tennis etc.
        keep_loans = {
            "yoga", "judo", "karaté", "kayak", "surf", "ski", "rugby", "tennis",
            "boxe", "canoë", "parachute", "golf", "hockey", "cricket",
            "baseball", "bowling", "penalty", "corner", "carton", "smash",
            "dribble", "jogging", "sprint", "marathon", "footing", "cross",
            "puzzle", "loto", "service",
        }
        if w.casefold() not in keep_loans and w.casefold() in {
            "end", "club", "green", "tee", "catch", "timer", "weekend",
            "cartoon", "anime", "manga", "hoodie", "overall", "running",
            "snow", "soccer", "dunk", "body", "zip", "compact", "poker",
            "bingo", "monopoly", "softball", "rebond",
        }:
            return False
    if w.casefold() in CLOSED:
        return False
    return True


def js_str(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)


def main() -> None:
    text = SRC.read_text(encoding="utf-8")
    have = existing_words(text)

    extras = []
    seen = set(have)
    for theme, blob in GROUPS.items():
        for word in tokenize_group(blob):
            if not is_ok_word(word):
                continue
            key = word.casefold()
            if key in seen:
                continue
            wr = faults(word)
            if len(wr) < 1:
                continue
            seen.add(key)
            d = 1 if len(word) <= 6 else 2 if len(word) <= 10 else 3
            extras.append((word, wr, d, theme))

    # Extra adjectives: skip pairs already present; filter junk
    adj_ok = []
    adj_seen = set()
    for m, f in ADJ_EXTRA:
        m, f = m.strip(), f.strip()
        if not m or not f:
            continue
        if " " in m or " " in f or "'" in m or "'" in f:
            continue
        pair = (m, f)
        if pair in adj_seen:
            continue
        adj_seen.add(pair)
        adj_ok.append(pair)

    er_ok = []
    er_seen = set()
    # existing ER
    er_m = re.search(r"const ER = \[\.\.\.new Set\(\[(.*?)\]\)\]", text, re.S)
    if er_m:
        for v in re.findall(r'"([^"]+)"', er_m.group(1)):
            er_seen.add(v)
    for v in ER_KEEP:
        if v in ER_DENY:
            continue
        if not v.endswith("er") or v.endswith("re") and not v.endswith("er"):
            continue
        if v in {"descendre", "remplir", "éteindre", "nourrir", "construire", "ouvrir"}:
            continue
        if v in er_seen:
            continue
        er_seen.add(v)
        er_ok.append(v)

    extra_js = ",\n".join(
        f"  [{js_str(t)}, {json.dumps(b, ensure_ascii=False)}, {d}, {js_str(g)}]"
        for t, b, d, g in extras
    )
    adj_js = ",\n".join(f"  [{js_str(m)}, {js_str(f)}]" for m, f in adj_ok)
    er_js = ", ".join(js_str(v) for v in er_ok)

    marker = "for (const [t, b, d, g] of MORE) addItem(t, b, d, g);"
    if marker not in text:
        raise SystemExit("MORE marker missing")
    if "const EXTRA_CE2" in text:
        text = re.sub(
            r"\nconst EXTRA_CE2 = \[\n.*?\n\];\nfor \(const \[t, b, d, g\] of EXTRA_CE2\) addItem\(t, b, d, g\);\n",
            "\n",
            text,
            count=1,
            flags=re.S,
        )

    inject = (
        f"{marker}\n\n"
        f"const EXTRA_CE2 = [\n{extra_js}\n];\n"
        f"for (const [t, b, d, g] of EXTRA_CE2) addItem(t, b, d, g);\n"
    )
    text = text.replace(marker, inject, 1)

    adj_marker = "for (const [m, f] of ADJ_E) addAdj(m, f, m.length > 6 ? 2 : 1);"
    if "const ADJ_EXTRA" in text:
        text = re.sub(
            r"\nconst ADJ_EXTRA = \[\n.*?\n\];\nfor \(const \[m, f\] of ADJ_EXTRA\) addAdj\(m, f, m.length > 6 \? 2 : 1\);\n",
            "\n",
            text,
            count=1,
            flags=re.S,
        )
    if adj_marker not in text:
        raise SystemExit("ADJ marker missing")
    text = text.replace(
        adj_marker,
        adj_marker
        + f"\n\nconst ADJ_EXTRA = [\n{adj_js}\n];\nfor (const [m, f] of ADJ_EXTRA) addAdj(m, f, m.length > 6 ? 2 : 1);\n",
        1,
    )

    er_anchor = '"apprécier", "détester",'
    if er_anchor not in text:
        raise SystemExit("ER anchor missing")
    if er_ok:
        text = text.replace(
            er_anchor,
            er_anchor + "\n  " + ", ".join(f'"{v}"' for v in er_ok) + ",",
            1,
        )

    assert_anchor = 'if (!words.some((w) => w.t === "chat" && w.g.startsWith("nom"))) errors.push("chat devrait être un nom");'
    extra_assert = """
const vocab = new Set(
  words
    .filter((w) => !/ · (présent|futur|imparfait|passé|impératif)/.test(w.g) && w.g !== "On va ___")
    .map((w) => w.t.toLowerCase())
);
if (vocab.size < 1900) errors.push("vocabulaire trop petit : " + vocab.size + " (attendu au moins 1900)");
if (words.some((w) => w.t === "trotinette")) errors.push("trotinette : il faut trottinette");
if (words.some((w) => w.t === "sale" && w.g.startsWith("nom"))) errors.push("sale ne doit pas être un nom");
"""
    if "vocabulaire trop petit" not in text:
        text = text.replace(assert_anchor, assert_anchor + extra_assert, 1)

    SRC.write_text(text, encoding="utf-8")
    print("EXTRA_CE2", len(extras))
    print("ADJ_EXTRA", len(adj_ok))
    print("ER_EXTRA", len(er_ok))
    print("unique extra nouns sample", extras[:8])


if __name__ == "__main__":
    main()
